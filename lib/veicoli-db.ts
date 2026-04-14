/**
 * @deprecated Catalogo legacy senza serie/anni. Sostituito dal modello DB `ModelloAuto`
 * gestito via /admin/catalogo. Mantenuto come fallback dei dropdown finché il catalogo
 * proprietario non raggiunge massa critica. Non aggiungere voci qui — usa l'admin UI.
 *
 * Database marche e modelli auto – fonte: AutoScout24.it (marche) + Wikipedia (modelli)
 * Include solo marche/modelli effettivamente diffusi sul mercato italiano.
 */
export const VEICOLI_DB: Record<string, string[]> = {
  'Abarth': [
    '124 Spider', '500', '500C', '595', '595C', '695', 'Grande Punto', 'Punto Evo',
  ],
  'Alfa Romeo': [
    '4C', '33', '75', '145', '146', '147', '155', '156', '159', '164', '166',
    'Brera', 'Giulia', 'Giulietta', 'GT', 'GTV', 'Mito', 'Spider', 'Stelvio', 'Tonale',
  ],
  'Alpine': [
    'A110',
  ],
  'Aston Martin': [
    'DB11', 'DB9', 'DBS', 'DBX', 'Rapide', 'Vantage',
  ],
  'Audi': [
    'A1', 'A2', 'A3', 'A4', 'A4 Allroad', 'A5', 'A6', 'A6 Allroad', 'A7', 'A8',
    'e-tron', 'e-tron GT', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'Q8 e-tron',
    'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q8',
    'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'SQ8',
    'TT', 'TTS', 'TT RS',
  ],
  'BMW': [
    'Serie 1', 'Serie 2', 'Serie 2 Active Tourer', 'Serie 2 Gran Tourer',
    'Serie 3', 'Serie 4', 'Serie 5', 'Serie 6', 'Serie 7', 'Serie 8',
    'M2', 'M3', 'M4', 'M5', 'M8',
    'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM',
    'Z3', 'Z4', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX3',
  ],
  'Bentley': [
    'Bentayga', 'Continental GT', 'Flying Spur',
  ],
  'BYD': [
    'Atto 3', 'Dolphin', 'Han', 'Seal', 'Tang',
  ],
  'Cadillac': [
    'BLS', 'CTS', 'Escalade', 'SRX', 'XT4', 'XT5',
  ],
  'Chevrolet': [
    'Aveo', 'Camaro', 'Captiva', 'Corvette', 'Cruze', 'Kalos', 'Lacetti',
    'Matiz', 'Nubira', 'Orlando', 'Spark', 'Trax',
  ],
  'Chrysler': [
    '300C', 'Grand Voyager', 'PT Cruiser', 'Sebring', 'Voyager',
  ],
  'Citroën': [
    'Berlingo', 'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C3 Pluriel',
    'C4', 'C4 Cactus', 'C4 Picasso', 'C4 SpaceTourer', 'C4 X',
    'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'C-Crosser', 'C-Elysée',
    'C-Zero', 'DS3', 'DS4', 'DS5', 'Jumper', 'Jumpy', 'Nemo',
    'Saxo', 'SpaceTourer', 'Xsara', 'Xsara Picasso',
  ],
  'CUPRA': [
    'Ateca', 'Born', 'Formentor', 'Leon', 'Tavascan',
  ],
  'Dacia': [
    'Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Logan MCV', 'Sandero',
    'Sandero Stepway', 'Spring',
  ],
  'Daewoo': [
    'Kalos', 'Lanos', 'Leganza', 'Matiz', 'Nubira', 'Tacuma',
  ],
  'Daihatsu': [
    'Charade', 'Copen', 'Cuore', 'Gran Move', 'Materia', 'Sirion', 'Terios', 'Trevis', 'YRV',
  ],
  'Dodge': [
    'Avenger', 'Caliber', 'Challenger', 'Charger', 'Journey', 'Nitro', 'RAM',
  ],
  'DR Automobiles': [
    'DR 1', 'DR 2', 'DR 3', 'DR 4', 'DR 5', 'DR 6', 'EVO 3', 'EVO 4', 'EVO 5', 'EVO 6',
  ],
  'DS Automobiles': [
    'DS 3', 'DS 3 Crossback', 'DS 4', 'DS 5', 'DS 7', 'DS 9',
  ],
  'Ferrari': [
    '296 GTB', '296 GTS', '360', '430', '458', '488', '488 Pista', '812',
    'California', 'F12', 'F40', 'F8', 'FF', 'GTC4Lusso',
    'LaFerrari', 'Portofino', 'Purosangue', 'Roma', 'SF90',
  ],
  'Fiat': [
    '500', '500C', '500L', '500X', '500e', '600', '600e',
    'Barchetta', 'Bravo', 'Brava', 'Coupé', 'Croma',
    'Doblò', 'Ducato', 'Fiorino', 'Freemont', 'Fullback',
    'Grande Punto', 'Idea', 'Linea', 'Marea', 'Multipla',
    'Palio', 'Panda', 'Punto', 'Punto Evo', 'Qubo',
    'Scudo', 'Sedici', 'Siena', 'Stilo', 'Strada',
    'Talento', 'Tempra', 'Tipo', 'Ulysse', 'Uno',
  ],
  'Ford': [
    'B-Max', 'C-Max', 'Cougar', 'EcoSport', 'Edge', 'Explorer',
    'Fiesta', 'Focus', 'Fusion', 'Galaxy', 'Ka', 'Ka+', 'Kuga',
    'Maverick', 'Mondeo', 'Mustang', 'Mustang Mach-E',
    'Puma', 'Ranger', 'S-Max', 'Tourneo Connect', 'Tourneo Courier', 'Tourneo Custom',
    'Transit', 'Transit Connect', 'Transit Courier', 'Transit Custom',
  ],
  'Genesis': [
    'G70', 'G80', 'GV60', 'GV70', 'GV80',
  ],
  'Honda': [
    'Accord', 'Civic', 'CR-V', 'CR-Z', 'e', 'FR-V', 'HR-V',
    'Insight', 'Jazz', 'Legend', 'S2000', 'ZR-V',
  ],
  'Hyundai': [
    'Accent', 'Atos', 'Bayon', 'Coupé', 'Galloper', 'Getz', 'i10', 'i20', 'i30', 'i40',
    'Ioniq', 'Ioniq 5', 'Ioniq 6', 'ix20', 'ix35', 'Kona', 'Kona Electric', 'Matrix',
    'Santa Fe', 'Terracan', 'Tucson',
  ],
  'Infiniti': [
    'FX', 'G', 'M', 'Q30', 'Q50', 'Q70', 'QX30', 'QX50', 'QX70',
  ],
  'Isuzu': [
    'D-Max',
  ],
  'Jaguar': [
    'E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ',
  ],
  'Jeep': [
    'Avenger', 'Cherokee', 'Commander', 'Compass', 'Gladiator', 'Grand Cherokee',
    'Patriot', 'Renegade', 'Wrangler',
  ],
  'Kia': [
    'Carens', 'Carnival', 'Ceed', 'EV6', 'EV9', 'Niro', 'Optima',
    'Picanto', 'ProCeed', 'Rio', 'Sorento', 'Soul',
    'Sportage', 'Stinger', 'Stonic', 'Venga', 'XCeed',
  ],
  'Lamborghini': [
    'Aventador', 'Gallardo', 'Huracán', 'Revuelto', 'Urus',
  ],
  'Lancia': [
    'Delta', 'Dedra', 'Kappa', 'Lybra', 'Musa', 'Phedra', 'Thesis', 'Ypsilon',
  ],
  'Land Rover': [
    'Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Freelander 2',
    'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar',
  ],
  'Lexus': [
    'CT', 'ES', 'GS', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'UX',
  ],
  'Maserati': [
    '3200 GT', 'Ghibli', 'GranCabrio', 'GranTurismo', 'Grecale', 'Levante',
    'MC20', 'Quattroporte',
  ],
  'Mazda': [
    '2', '3', '5', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60',
    'MX-5', 'MX-30', 'Premacy', 'RX-8',
  ],
  'Mercedes-Benz': [
    'Classe A', 'Classe B', 'Classe C', 'Classe CLA', 'Classe CLE', 'Classe CLS',
    'Classe E', 'Classe G', 'Classe GLA', 'Classe GLB', 'Classe GLC', 'Classe GLC Coupé',
    'Classe GLE', 'Classe GLE Coupé', 'Classe GLS', 'Classe S', 'Classe V', 'Classe X',
    'AMG GT', 'AMG SL',
    'Citan', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV',
    'Marco Polo', 'SL', 'SLC', 'SLK', 'Sprinter', 'Vaneo', 'Vito',
  ],
  'MG': [
    'EHS', 'HS', 'MG3', 'MG4', 'MG5', 'ZS', 'ZS EV',
  ],
  'Mini': [
    'Cabrio', 'Clubman', 'Countryman', 'Coupé', 'Mini', 'One', 'Paceman', 'Roadster',
  ],
  'Mitsubishi': [
    'ASX', 'Colt', 'Eclipse Cross', 'Grandis', 'L200', 'Lancer',
    'Outlander', 'Pajero', 'Pajero Sport', 'Space Star',
  ],
  'Nissan': [
    'Almera', 'Ariya', 'e-NV200', 'Juke', 'Leaf', 'Micra',
    'Murano', 'Navara', 'Note', 'NV200', 'NV300', 'NV400',
    'Pathfinder', 'Pixo', 'Primastar', 'Primera', 'Pulsar',
    'Qashqai', 'Qashqai+2', 'Terrano', 'X-Trail',
  ],
  'Opel': [
    'Adam', 'Agila', 'Ampera', 'Ampera-e', 'Antara', 'Astra', 'Cascada', 'Combo',
    'Corsa', 'Corsa-e', 'Crossland', 'Crossland X', 'Frontera',
    'Grandland', 'Grandland X', 'GT',
    'Insignia', 'Karl', 'Meriva', 'Mokka', 'Mokka-e',
    'Movano', 'Omega', 'Signum', 'Speedster', 'Tigra',
    'Vectra', 'Vivaro', 'Zafira', 'Zafira Life', 'Zafira Tourer',
  ],
  'Peugeot': [
    '106', '107', '108', '1007', '2008', 'e-2008',
    '206', '206+', '207', '208', 'e-208',
    '3008', '301', '306', '307', '308', 'e-308',
    '4007', '4008', '406', '407', '408',
    '5008', '508',
    '607', '806', '807',
    'Bipper', 'Boxer', 'Expert', 'iOn', 'Partner', 'Ranch', 'RCZ', 'Rifter', 'Traveller',
  ],
  'Polestar': [
    '1', '2', '3', '4',
  ],
  'Porsche': [
    '718 Boxster', '718 Cayman', '911', 'Boxster', 'Cayenne', 'Cayman',
    'Macan', 'Panamera', 'Taycan',
  ],
  'Renault': [
    'Arkana', 'Austral', 'Avantime', 'Captur', 'Clio', 'Espace', 'Fluence',
    'Grand Modus', 'Grand Scenic', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna',
    'Latitude', 'Master', 'Megane', 'Megane E-Tech', 'Modus',
    'Rafale', 'Scenic', 'Scenic E-Tech', 'Symbioz', 'Talisman',
    'Trafic', 'Twingo', 'Vel Satis', 'Wind', 'Zoe',
  ],
  'Rolls-Royce': [
    'Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Spectre', 'Wraith',
  ],
  'Rover': [
    '25', '45', '75', 'Streetwise',
  ],
  'Saab': [
    '9-3', '9-5',
  ],
  'SEAT': [
    'Alhambra', 'Altea', 'Arona', 'Arosa', 'Ateca', 'Cordoba',
    'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo',
  ],
  'Škoda': [
    'Citigo', 'Elroq', 'Enyaq', 'Fabia', 'Kamiq', 'Karoq',
    'Kodiaq', 'Octavia', 'Rapid', 'Roomster', 'Scala',
    'Superb', 'Yeti',
  ],
  'Smart': [
    'Forfour', 'Fortwo', 'Roadster', '#1', '#3',
  ],
  'SsangYong': [
    'Actyon', 'Korando', 'Kyron', 'Musso', 'Rexton', 'Rodius', 'Tivoli', 'XLV',
  ],
  'Subaru': [
    'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Justy', 'Legacy',
    'Levorg', 'Outback', 'Solterra', 'Trezia', 'WRX', 'XV',
  ],
  'Suzuki': [
    'Across', 'Alto', 'Baleno', 'Celerio', 'Grand Vitara',
    'Ignis', 'Jimny', 'Liana', 'S-Cross', 'Splash', 'S-Presso',
    'Swace', 'Swift', 'SX4', 'SX4 S-Cross', 'Vitara', 'Wagon R+',
  ],
  'Tesla': [
    'Model 3', 'Model S', 'Model X', 'Model Y',
  ],
  'Toyota': [
    'Auris', 'Avensis', 'Avensis Verso', 'Aygo', 'Aygo X', 'bZ4X',
    'C-HR', 'Camry', 'Celica', 'Corolla', 'Corolla Cross', 'Corolla Verso',
    'FJ Cruiser', 'GT86', 'GR86', 'GR Yaris', 'Highlander', 'Hilux',
    'iQ', 'Land Cruiser', 'Mirai', 'MR2', 'Prius', 'Prius+',
    'ProAce', 'ProAce City', 'ProAce Verso',
    'RAV4', 'Supra', 'Urban Cruiser', 'Verso', 'Yaris', 'Yaris Cross',
  ],
  'Volkswagen': [
    'Amarok', 'Arteon', 'Beetle', 'Bora', 'Caddy', 'California', 'Caravelle',
    'CC', 'Crafter', 'e-Golf', 'e-Up', 'Eos', 'Fox',
    'Golf', 'Golf Plus', 'Golf Sportsvan', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'ID.Buzz',
    'Lupo', 'Multivan', 'New Beetle', 'Passat', 'Passat Alltrack',
    'Phaeton', 'Polo', 'Scirocco', 'Sharan', 'T-Cross', 'T-Roc', 'Taigo',
    'Tiguan', 'Tiguan Allspace', 'Touareg', 'Touran', 'Transporter', 'Up',
  ],
  'Volvo': [
    'C30', 'C40', 'C70', 'EX30', 'EX90',
    'S40', 'S60', 'S80', 'S90',
    'V40', 'V40 Cross Country', 'V50', 'V60', 'V60 Cross Country', 'V70', 'V90', 'V90 Cross Country',
    'XC40', 'XC60', 'XC70', 'XC90',
  ],
};

/** Lista ordinata delle marche */
export const MARCHE = Object.keys(VEICOLI_DB).sort();

/** Restituisce i modelli per una marca data */
export function getModelli(marca: string): string[] {
  return VEICOLI_DB[marca] ?? [];
}
