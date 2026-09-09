import { Coordinates } from '../types';

export interface PopularPlace {
  id: string;
  name: string;
  address: string;
  barrio: string;
  category: 'station' | 'subway' | 'landmark' | 'avenue' | 'shopping' | 'university';
  coordinates: Coordinates;
}

export const BUENOS_AIRES_PLACES: PopularPlace[] = [
  // Major Train & Bus Hubs
  {
    id: 'retiro-station',
    name: 'Estación Retiro (Mitre / San Martín)',
    address: 'Av. Ramos Mejía 1300',
    barrio: 'Retiro',
    category: 'station',
    coordinates: { lat: -34.5912, lng: -58.3758 },
  },
  {
    id: 'once-station',
    name: 'Estación Once / Plaza Miserere',
    address: 'Av. Pueyrredón & Bartolomé Mitre',
    barrio: 'Balvanera / Once',
    category: 'station',
    coordinates: { lat: -34.6092, lng: -58.4065 },
  },
  {
    id: 'constitucion-station',
    name: 'Estación Constitución (Roca)',
    address: 'Av. Brasil 1128',
    barrio: 'Constitución',
    category: 'station',
    coordinates: { lat: -34.6275, lng: -58.3810 },
  },
  {
    id: 'chacarita-station',
    name: 'Estación Federico Lacroze (Urquiza)',
    address: 'Av. Corrientes & Av. Federico Lacroze',
    barrio: 'Chacarita',
    category: 'station',
    coordinates: { lat: -34.5872, lng: -58.4552 },
  },
  {
    id: 'belgrano-c-station',
    name: 'Estación Belgrano C (Mitre)',
    address: 'Juramento & Av. Virrey Vértiz',
    barrio: 'Belgrano',
    category: 'station',
    coordinates: { lat: -34.5574, lng: -58.4503 },
  },

  // Subway Hubs (Subte)
  {
    id: 'subte-d-plaza-italia',
    name: 'Plaza Italia (Subte Línea D)',
    address: 'Av. Santa Fe 4100',
    barrio: 'Palermo',
    category: 'subway',
    coordinates: { lat: -34.5808, lng: -58.4208 },
  },
  {
    id: 'subte-d-palermo',
    name: 'Estación Palermo (Subte D / San Martín)',
    address: 'Av. Santa Fe & Av. Juan B. Justo',
    barrio: 'Palermo',
    category: 'subway',
    coordinates: { lat: -34.5772, lng: -58.4264 },
  },
  {
    id: 'subte-d-scalabrini',
    name: 'Scalabrini Ortiz (Subte Línea D)',
    address: 'Av. Santa Fe & Scalabrini Ortiz',
    barrio: 'Palermo',
    category: 'subway',
    coordinates: { lat: -34.5867, lng: -58.4136 },
  },
  {
    id: 'subte-b-medrano',
    name: 'Medrano (Subte Línea B)',
    address: 'Av. Corrientes & Av. Medrano',
    barrio: 'Almagro',
    category: 'subway',
    coordinates: { lat: -34.6031, lng: -58.4215 },
  },
  {
    id: 'subte-b-carlos-gardel',
    name: 'Carlos Gardel / Abasto (Subte B)',
    address: 'Av. Corrientes & Anchorena',
    barrio: 'Balvanera',
    category: 'subway',
    coordinates: { lat: -34.6038, lng: -58.4109 },
  },
  {
    id: 'subte-a-primera-junta',
    name: 'Primera Junta (Subte Línea A)',
    address: 'Av. Rivadavia & Rojas',
    barrio: 'Caballito',
    category: 'subway',
    coordinates: { lat: -34.6206, lng: -58.4418 },
  },
  {
    id: 'subte-h-santa-fe',
    name: 'Santa Fe - Carlos Jáuregui (Subte H/D)',
    address: 'Av. Santa Fe & Av. Pueyrredón',
    barrio: 'Recoleta',
    category: 'subway',
    coordinates: { lat: -34.5937, lng: -58.4017 },
  },

  // Landmarks & Entertainment
  {
    id: 'obelisco',
    name: 'Obelisco de Buenos Aires',
    address: 'Av. 9 de Julio & Av. Corrientes',
    barrio: 'San Nicolás / Centro',
    category: 'landmark',
    coordinates: { lat: -34.6037, lng: -58.3816 },
  },
  {
    id: 'plaza-serrano',
    name: 'Plaza Serrano (Plazoleta Cortázar)',
    address: 'Honduras & Serrano',
    barrio: 'Palermo Soho',
    category: 'landmark',
    coordinates: { lat: -34.5885, lng: -58.4302 },
  },
  {
    id: 'plaza-dorrego',
    name: 'Plaza Dorrego',
    address: 'Defensa & Humberto 1°',
    barrio: 'San Telmo',
    category: 'landmark',
    coordinates: { lat: -34.6198, lng: -58.3712 },
  },
  {
    id: 'congreso-nacion',
    name: 'Congreso de la Nación',
    address: 'Av. Rivadavia & Av. Callao',
    barrio: 'Congreso / Balvanera',
    category: 'landmark',
    coordinates: { lat: -34.6099, lng: -58.3926 },
  },
  {
    id: 'puerto-madero-puente',
    name: 'Puente de la Mujer / Puerto Madero',
    address: 'Dique 3, Pierina Dealessi',
    barrio: 'Puerto Madero',
    category: 'landmark',
    coordinates: { lat: -34.6078, lng: -58.3649 },
  },
  {
    id: 'plaza-francia',
    name: 'Plaza Francia / Recoleta Cultural',
    address: 'Av. del Libertador & Pueyrredón',
    barrio: 'Recoleta',
    category: 'landmark',
    coordinates: { lat: -34.5862, lng: -58.3908 },
  },
  {
    id: 'parque-centenario',
    name: 'Parque Centenario',
    address: 'Av. Díaz Vélez & Leopoldo Marechal',
    barrio: 'Caballito / Almagro',
    category: 'landmark',
    coordinates: { lat: -34.6062, lng: -58.4355 },
  },
  {
    id: 'parque-rivadavia',
    name: 'Parque Rivadavia',
    address: 'Av. Rivadavia 4900',
    barrio: 'Caballito',
    category: 'landmark',
    coordinates: { lat: -34.6179, lng: -58.4328 },
  },

  // Major Commercial & University Centers
  {
    id: 'alto-palermo',
    name: 'Alto Palermo Shopping',
    address: 'Av. Santa Fe 3253',
    barrio: 'Palermo',
    category: 'shopping',
    coordinates: { lat: -34.5878, lng: -58.4109 },
  },
  {
    id: 'abasto-shopping',
    name: 'Abasto Shopping',
    address: 'Av. Corrientes 3247',
    barrio: 'Balvanera',
    category: 'shopping',
    coordinates: { lat: -34.6033, lng: -58.4111 },
  },
  {
    id: 'fadu-ciudad-universitaria',
    name: 'Ciudad Universitaria (UBA)',
    address: 'Av. Int. Güiraldes 2160',
    barrio: 'Núñez',
    category: 'university',
    coordinates: { lat: -34.5434, lng: -58.4385 },
  },
  {
    id: 'facultad-medicina',
    name: 'Facultad de Medicina (UBA)',
    address: 'Paraguay 2155 & Av. Córdoba',
    barrio: 'Recoleta',
    category: 'university',
    coordinates: { lat: -34.5996, lng: -58.3995 },
  },
  {
    id: 'palermo-hollywood',
    name: 'Palermo Hollywood (Fitz Roy & Honduras)',
    address: 'Fitz Roy & Honduras',
    barrio: 'Palermo Hollywood',
    category: 'landmark',
    coordinates: { lat: -34.5828, lng: -58.4346 },
  },
  {
    id: 'av-corrientes-callao',
    name: 'Av. Corrientes & Av. Callao',
    address: 'Av. Corrientes 1700',
    barrio: 'San Nicolás / Balvanera',
    category: 'avenue',
    coordinates: { lat: -34.6046, lng: -58.3927 },
  },
  {
    id: 'av-santa-fe-callao',
    name: 'Av. Santa Fe & Av. Callao',
    address: 'Av. Santa Fe 1700',
    barrio: 'Recoleta',
    category: 'avenue',
    coordinates: { lat: -34.5960, lng: -58.3932 },
  },
  {
    id: 'cabildo-juramento',
    name: 'Av. Cabildo & Juramento',
    address: 'Av. Cabildo 2000',
    barrio: 'Belgrano',
    category: 'avenue',
    coordinates: { lat: -34.5623, lng: -58.4561 },
  }
];
