import { useAcademico } from '../store/SesionContext.jsx';
import { useComunidad } from '../store/ComunidadContext.jsx';

/** Quién eres en Green Community: lo que pusiste al publicar o, si no, tu nombre y curso de la sesión. */
export function usePerfil() {
  const m = useAcademico();
  const { perfil } = useComunidad();
  return perfil || { nombre: m.nombreCompleto, curso: m.curso };
}
