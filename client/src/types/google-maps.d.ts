/// <reference types="google.maps" />

declare namespace google.maps.places {
  interface PlaceResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
    geometry?: {
      location: LatLng;
      viewport?: LatLngBounds;
    };
    icon?: string;
    name?: string;
    photos?: PlacePhoto[];
    place_id?: string;
    plus_code?: PlusCode;
    types?: string[];
    url?: string;
    utc_offset?: number;
    vicinity?: string;
    website?: string;
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }
}