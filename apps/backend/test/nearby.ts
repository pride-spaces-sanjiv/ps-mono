import { getNearbyPlaces } from "@pride-spaces/backend/utils/services/geo/find-place.js";

await getNearbyPlaces({ lat: 12.9760037, lng: 77.7263381, radius: 5 * 1000 });
