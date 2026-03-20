export const parseAddress = (
  components: google.maps.GeocoderResult["address_components"],
) => {
  //   console.log(components);
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name;

  return {
    country: get("country"),
    state: get("administrative_area_level_1"),
    city: get("locality") || get("administrative_area_level_2"),
    area:
      get("sublocality") ||
      get("neighborhood") ||
      get("administrative_area_level_3"),
    postalCode: get("postal_code"),
  };
};

export const geocodeLatLng = (lat: number, lng: number) => {
  return new Promise<ReturnType<typeof parseAddress> & { address: string }>(
    (resolve, reject) => {
      if (!window.google) return reject("Google not loaded");

      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.length) {
          // console.log(results);
          const parsed = parseAddress(results[0].address_components);
          resolve({ ...parsed, address: results[0].formatted_address });
        } else {
          reject(status);
        }
      });
    },
  );
};
