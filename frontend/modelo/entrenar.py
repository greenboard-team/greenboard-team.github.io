"""
Entrena el moderador de Green Community y lo exporta a src/data/modeloModeracion.json.

    pip install scikit-learn
    python entrenar.py

Modelo: n-gramas de caracteres (3 a 5) + TF-IDF + regresión logística multinomial (ok / revisar / bloquear).
Los n-gramas de caracteres aguantan faltas de ortografía y trucos («m4tar», «fooolla»), y el texto se
normaliza igual que en la app (src/domain/moderacion/modelo.js). Pesa unos cientos de KB y responde al
instante en el navegador, sin servidor.

La evaluación separa PLANTILLAS (no frases sueltas): el modelo se evalúa con frases de plantillas que no
ha visto al entrenar, para no engañarnos con una precisión inflada.
"""
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit

from datos import datos

CLASES = ['ok', 'revisar', 'bloquear']
LEET = {'0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '€': 'e'}


def normalizar(texto: str) -> str:
    """Igual que normalizar() + sinRepetidas() de src/domain/moderacion/reglas.js."""
    t = unicodedata.normalize('NFD', str(texto).lower())
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = ''.join(LEET.get(c, c) for c in t)
    t = re.sub(r'[^a-z0-9]+', ' ', t).strip()
    t = re.sub(r'\b(?:[a-z] ){2,}[a-z]\b', lambda m: m.group(0).replace(' ', ''), t)
    t = re.sub(r'([aeiou])\1+', r'\1', t)
    t = re.sub(r'([^aeiou\s])\1{2,}', r'\1\1', t)
    return t


# Umbrales: preferimos dejar pasar algo dudoso a revisión antes que bloquear un plan normal
UMBRAL_BLOQUEAR = 0.55
UMBRAL_REVISAR = 0.45


def decidir(p):
    if p[2] >= UMBRAL_BLOQUEAR:
        return 'bloquear'
    if p[1] + p[2] >= UMBRAL_REVISAR:
        return 'revisar'
    return 'ok'


def main():
    filas = datos()
    textos = [normalizar(t) for t, _, _ in filas]
    y = np.array([CLASES.index(e) for _, e, _ in filas])
    grupos = [g for _, _, g in filas]
    print(f'{len(filas)} ejemplos ·', dict(Counter(e for _, e, _ in filas)))

    vect = TfidfVectorizer(analyzer='char', ngram_range=(3, 5), lowercase=False, max_features=6000, sublinear_tf=False)
    clf = LogisticRegression(max_iter=3000, C=8, class_weight='balanced')

    # 1) Evaluación honesta: 25 % de las plantillas fuera del entrenamiento
    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=3).split(textos, y, grupos))
    Xtr = vect.fit_transform([textos[i] for i in tr])
    clf.fit(Xtr, y[tr])
    probs = clf.predict_proba(vect.transform([textos[i] for i in te]))
    pred = [CLASES.index(decidir(p)) for p in probs]
    print('\nEvaluación con plantillas no vistas:')
    print(classification_report(y[te], pred, labels=[0, 1, 2], target_names=CLASES, zero_division=0))
    print('Matriz de confusión (filas = real, columnas = predicho):', CLASES)
    print(confusion_matrix(y[te], pred, labels=[0, 1, 2]))
    ok_reales = [i for i, k in enumerate(te) if y[k] == 0]
    falsos = sum(1 for i in ok_reales if pred[i] == 2)
    print(f'Planes normales bloqueados por error: {falsos} de {len(ok_reales)}')
    metricas = {
        'ejemplos': len(filas),
        'plantillasTest': len(set(grupos[i] for i in te)),
        'precisionTest': round(float(np.mean(np.array(pred) == y[te])), 3),
        'okBloqueadosPorError': f'{falsos}/{len(ok_reales)}',
    }

    # 2) Modelo final con todos los datos
    X = vect.fit_transform(textos)
    clf.fit(X, y)
    vocab = vect.vocabulary_
    orden = sorted(vocab, key=vocab.get)
    salida = {
        '_leeme': 'Generado por frontend/modelo/entrenar.py. No editar a mano: añade ejemplos en datos.py y vuelve a entrenar.',
        'version': 1,
        'clases': CLASES,
        'ngramas': [3, 5],
        'umbrales': {'bloquear': UMBRAL_BLOQUEAR, 'revisar': UMBRAL_REVISAR},
        'metricas': metricas,
        'vocabulario': orden,
        'idf': [round(float(v), 5) for v in vect.idf_],
        'pesos': [[round(float(w), 4) for w in fila] for fila in clf.coef_],
        'sesgo': [round(float(b), 5) for b in clf.intercept_],
        # Casos de control: la app comprueba en sus tests que da las mismas probabilidades que Python
        'control': [],
    }
    for t in ['Vamos a reírnos de Hugo en la cafetería', 'Pachanga de fútbol sala el miércoles', 'Voy a m4tar a Pablo', 'Apostamos 5 euros al FIFA']:
        p = clf.predict_proba(vect.transform([normalizar(t)]))[0]
        salida['control'].append({'texto': t, 'probabilidades': [round(float(x), 5) for x in p]})

    destino = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'modeloModeracion.json'
    destino.write_text(json.dumps(salida, ensure_ascii=False, separators=(',', ':')))
    print(f'\nGuardado {destino.name}: {destino.stat().st_size / 1024:.0f} KB, {len(orden)} n-gramas')
    print('Control:', [(c['texto'], CLASES[int(np.argmax(c["probabilidades"]))]) for c in salida['control']])


if __name__ == '__main__':
    main()
