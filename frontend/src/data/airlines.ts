import { Airline, FareClassMapping } from '@/lib/types';

export const airlines: Record<string, Airline> = {
  DL: {
    code: 'DL',
    name: 'Delta Air Lines',
    color: '#0C1464',
    bgColor: '#B5E4F3',
    personalItemFree: true,
    carryOnFree: true,
    checkedBagFee: 35,
    secondCheckedBagFee: 45,
  },
  AA: {
    code: 'AA',
    name: 'American Airlines',
    color: '#FF4B4B',
    bgColor: '#F8E5DE',
    personalItemFree: true,
    carryOnFree: true,
    checkedBagFee: 35,
    secondCheckedBagFee: 45,
  },
  UA: {
    code: 'UA',
    name: 'United Airlines',
    color: '#2875F1',
    bgColor: '#B5E4F3',
    personalItemFree: true,
    carryOnFree: true,
    checkedBagFee: 35,
    secondCheckedBagFee: 45,
  },
  WN: {
    code: 'WN',
    name: 'Southwest Airlines',
    color: '#0A1628',
    bgColor: '#FFDC8C',
    personalItemFree: true,
    carryOnFree: true,
    checkedBagFee: 0,
    secondCheckedBagFee: 0,
  },
  NK: {
    code: 'NK',
    name: 'Spirit Airlines',
    color: '#FFFFFF',
    bgColor: '#696E28',
    personalItemFree: true,
    carryOnFree: false,
    checkedBagFee: 55,
    secondCheckedBagFee: 65,
  },
  F9: {
    code: 'F9',
    name: 'Frontier Airlines',
    color: '#FFFFFF',
    bgColor: '#2D4B37',
    personalItemFree: true,
    carryOnFree: false,
    checkedBagFee: 52,
    secondCheckedBagFee: 62,
  },
  B6: {
    code: 'B6',
    name: 'JetBlue Airways',
    color: '#FFFFFF',
    bgColor: '#2196D4',
    personalItemFree: true,
    carryOnFree: true,
    checkedBagFee: 35,
    secondCheckedBagFee: 45,
  },
  AS: {
    code: 'AS',
    name: 'Alaska Airlines',
    color: '#B5E4F3',
    bgColor: '#551E5F',
    personalItemFree: true,
    carryOnFree: true,
    checkedBagFee: 35,
    secondCheckedBagFee: 45,
  },
};

export const fareClassMappings: FareClassMapping[] = [
  // Delta
  { airlineCode: 'DL', airlineName: 'Delta Air Lines', proprietaryTerm: 'Basic Economy', standardLabel: 'Basic Economy', description: 'Most restrictive fare, no changes or upgrades', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'DL', airlineName: 'Delta Air Lines', proprietaryTerm: 'Main Cabin', standardLabel: 'Economy', description: 'Standard economy with seat selection and changes allowed', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'DL', airlineName: 'Delta Air Lines', proprietaryTerm: 'Delta Comfort+', standardLabel: 'Premium Economy', description: 'Extra legroom, priority boarding, snacks', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'DL', airlineName: 'Delta Air Lines', proprietaryTerm: 'Delta One', standardLabel: 'Business', description: 'Lie-flat seat, premium meals, lounge access', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
  // American
  { airlineCode: 'AA', airlineName: 'American Airlines', proprietaryTerm: 'Basic Economy', standardLabel: 'Basic Economy', description: 'No changes, last to board, no overhead bin (carry-on)', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'AA', airlineName: 'American Airlines', proprietaryTerm: 'Main Cabin', standardLabel: 'Economy', description: 'Standard economy with carry-on and changes', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'AA', airlineName: 'American Airlines', proprietaryTerm: 'Main Cabin Extra', standardLabel: 'Premium Economy', description: 'Extra legroom, priority boarding', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'AA', airlineName: 'American Airlines', proprietaryTerm: 'Flagship Business', standardLabel: 'Business', description: 'Lie-flat seat, premium dining, lounge access', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
  // United
  { airlineCode: 'UA', airlineName: 'United Airlines', proprietaryTerm: 'Basic Economy', standardLabel: 'Basic Economy', description: 'No carry-on, last to board, no changes', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'UA', airlineName: 'United Airlines', proprietaryTerm: 'Economy', standardLabel: 'Economy', description: 'Standard economy with carry-on', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'UA', airlineName: 'United Airlines', proprietaryTerm: 'Economy Plus', standardLabel: 'Premium Economy', description: 'Extra legroom, Economy Plus seating', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'UA', airlineName: 'United Airlines', proprietaryTerm: 'United Polaris', standardLabel: 'Business', description: 'Lie-flat pod, Polaris lounge, premium dining', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
  // Southwest
  { airlineCode: 'WN', airlineName: 'Southwest Airlines', proprietaryTerm: 'Wanna Get Away', standardLabel: 'Basic Economy', description: 'Lowest fare, limited credit for changes', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'WN', airlineName: 'Southwest Airlines', proprietaryTerm: 'Wanna Get Away Plus', standardLabel: 'Economy', description: 'Transferable flight credits, same-day changes', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'WN', airlineName: 'Southwest Airlines', proprietaryTerm: 'Anytime', standardLabel: 'Flexible Economy', description: 'Refundable, same-day standby, extra points', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'WN', airlineName: 'Southwest Airlines', proprietaryTerm: 'Business Select', standardLabel: 'Business', description: 'Priority boarding A1-A15, premium drink, WiFi', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: false, changeFee: 0 },
  // Spirit
  { airlineCode: 'NK', airlineName: 'Spirit Airlines', proprietaryTerm: 'Bare Fare', standardLabel: 'Ultra Basic', description: 'Personal item only, everything else costs extra', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 99 },
  { airlineCode: 'NK', airlineName: 'Spirit Airlines', proprietaryTerm: 'Big Front Seat', standardLabel: 'Premium Economy', description: 'Wider seat, extra legroom, still a-la-carte bags', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 99 },
  // Frontier
  { airlineCode: 'F9', airlineName: 'Frontier Airlines', proprietaryTerm: 'Basic', standardLabel: 'Ultra Basic', description: 'Personal item only, all add-ons extra', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 99 },
  { airlineCode: 'F9', airlineName: 'Frontier Airlines', proprietaryTerm: 'The Works', standardLabel: 'Economy Bundle', description: 'Carry-on, checked bag, seat selection, priority', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
  // JetBlue
  { airlineCode: 'B6', airlineName: 'JetBlue Airways', proprietaryTerm: 'Blue Basic', standardLabel: 'Basic Economy', description: 'No carry-on bag, last to board', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 100 },
  { airlineCode: 'B6', airlineName: 'JetBlue Airways', proprietaryTerm: 'Blue', standardLabel: 'Economy', description: 'Carry-on, snacks, entertainment, legroom', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'B6', airlineName: 'JetBlue Airways', proprietaryTerm: 'Blue Plus', standardLabel: 'Economy Plus', description: 'Checked bag included, extra TrueBlue points', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'B6', airlineName: 'JetBlue Airways', proprietaryTerm: 'Mint', standardLabel: 'Business', description: 'Lie-flat suite, premium food, amenity kit', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
  // Alaska
  { airlineCode: 'AS', airlineName: 'Alaska Airlines', proprietaryTerm: 'Saver', standardLabel: 'Basic Economy', description: 'No carry-on, no upgrades, last to board', personalItemIncluded: true, carryOnIncluded: false, checkedBagIncluded: false, seatSelectionIncluded: false, changeFee: 0 },
  { airlineCode: 'AS', airlineName: 'Alaska Airlines', proprietaryTerm: 'Main', standardLabel: 'Economy', description: 'Carry-on included, free seat selection', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: false, seatSelectionIncluded: true, changeFee: 0 },
  { airlineCode: 'AS', airlineName: 'Alaska Airlines', proprietaryTerm: 'First Class', standardLabel: 'First', description: 'Extra legroom, premium food, free bags', personalItemIncluded: true, carryOnIncluded: true, checkedBagIncluded: true, seatSelectionIncluded: true, changeFee: 0 },
];

export function getAirline(code: string): Airline {
  return airlines[code] || airlines.DL;
}

export function getFareClassesForAirline(code: string): FareClassMapping[] {
  return fareClassMappings.filter(f => f.airlineCode === code);
}
