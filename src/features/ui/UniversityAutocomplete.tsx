import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const UNIVERSIDADES = [
  'UBA - Universidad de Buenos Aires',
  'UTDT - Universidad Torcuato Di Tella',
  'UP - Universidad de Palermo',
  'UCEMA - Universidad del CEMA',
  'UNTREF - Universidad Nacional de Tres de Febrero',
  'UCES - Universidad de Ciencias Empresariales y Sociales',
  'UNLP - Universidad Nacional de La Plata',
  'UCA - Universidad Católica Argentina',
  'UADE - Universidad Argentina de la Empresa',
  'UNL - Universidad Nacional del Litoral',
  'UNC - Universidad Nacional de Córdoba',
  'UNMSM - Universidad Nacional Mayor de San Marcos',
  'UNNE - Universidad Nacional del Nordeste',
  'UNPSJB - Universidad Nacional de la Patagonia San Juan Bosco',
  'UNRC - Universidad Nacional de Río Cuarto',
  'UNSJ - Universidad Nacional de San Juan',
  'UNSE - Universidad Nacional de Santiago del Estero',
  'UNTL - Universidad Nacional de Tucumán',
  'UNSL - Universidad Nacional de San Luis',
  'UTN - Universidad Tecnológica Nacional',
  'UNSAM - Universidad Nacional de San Martín',
  'UNAJ - Universidad Nacional Arturo Jauretche',
  'UNIPE - Universidad Pedagógica',
  'UNIR - Universidad Internacional de La Rioja',
  'ICES - Instituto Católico de Estudios Superiores',
  'San José - Universidad del Salvador',
  'Universidad de Belgrano',
  'ICBC - Instituto de Crédito e Inversiones',
  'ISPEC - Instituto Superior Privado de Estudios Comerciales',
  'ISEN - Instituto Superior de Enseñanza',
  'Siglo 21 - Universidad Siglo 21',
  'UMSA - Universidad Modelo de San Andrés',
];

export function UniversityAutocomplete({
  value,
  onChange,
  placeholder = 'Busca tu universidad...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = UNIVERSIDADES.filter((u) =>
    u.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  // Sincronizar el valor externo con el estado interno
  useEffect(() => {
    if (!isOpen) {
      setSearch(value);
    }
  }, [value, isOpen]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (university: string) => {
    onChange(university);
    setSearch(university);
    setIsOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setSearch(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 transition-colors hover:border-white/30 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/20"
        />
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="dash-panel absolute z-50 mt-2 w-full overflow-y-auto rounded-lg border border-white/20 shadow-xl max-h-64">
          {filtered.length > 0 ? (
            <ul className="py-1">
              {filtered.map((university) => (
                <li key={university}>
                  <button
                    type="button"
                    onClick={() => handleSelect(university)}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {university}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-white/50 text-center">
              Sin coincidencias
            </div>
          )}
        </div>
      )}
    </div>
  );
}
