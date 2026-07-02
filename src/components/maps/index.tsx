import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Autocomplete,
  type Libraries,
} from "@react-google-maps/api";
import { MapPin, NotebookPenIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useDebouncer } from "@/services/hooks/use-debouncer";
import { cn } from "@/utils/className";
import { geocodeLatLng, getLatLngFromMapsURL } from "@/utils/data/geocode";
import ActionButton from "../buttons/action-btn";
import FormField from "../form/field";

const libs: Libraries = ["maps", "places", "marker"];

type Props = {
  showCoords: boolean;
  zoom: number;
  defaultCoords: { lat: number; lng: number };
  onCoordsChange: (coords: { lat: number; lng: number }) => void;
  mapProps: ComponentProps<typeof GoogleMap>;
  wrapperProps: React.ComponentProps<"div">;
  buttonProps: React.ComponentProps<typeof ActionButton>;
  searchInputProps: React.ComponentProps<typeof Input>;
  geocodeDebounceDelay: number;
  onGeocodeLatLng: (
    result: Awaited<ReturnType<typeof geocodeLatLng>>,
    coords: { lat: number; lng: number },
  ) => any;
  onLatLngFromURL: (value: { lat: number; lng: number; url: string }) => any;
  onMapsShareURL: (value: string) => any;
};

export default function MapsField({
  showCoords = true,
  zoom = 15,
  defaultCoords = { lat: 19.311143355064655, lng: 77.34375000000001 },
  onCoordsChange,
  mapProps,
  wrapperProps,
  buttonProps,
  searchInputProps,
  geocodeDebounceDelay = 500,
  onGeocodeLatLng,
  onLatLngFromURL,
  onMapsShareURL,
}: Partial<Props>) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libs,
  });

  const inputRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    defaultCoords,
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    defaultCoords,
  );
  const [url, setUrl] = useState("");

  const updateToCurrentLocation = (defaultLocation = false) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // console.log(coords);
        setCenter(coords);
        setCoords(coords);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.info("Location access denied");
        }
        if (err.code === err.POSITION_UNAVAILABLE) {
          toast.info("Location unavailable");
        }
        if (err.code === err.TIMEOUT) {
          toast.info("Location access timed-out");
        }
        console.log("Error accessing location :", err.message);
        // defaultLocation && setCenter(initialLoc);
      },
      { enableHighAccuracy: true },
    );
  };

  const handleMapsURLGeocode = async (url: string) => {
    const coords = await getLatLngFromMapsURL(url);
    coords && onLatLngFromURL?.({ ...coords, url });
  };

  useEffect(() => {
    !defaultCoords && updateToCurrentLocation?.();
    return () => {};
  }, []);

  useEffect(() => {});

  return (
    <div className={cn("", wrapperProps?.className)}>
      {isLoaded && (
        <>
          <GoogleMap
            id="map-container"
            center={center}
            zoom={zoom || 15}
            onMouseMove={(e) => {
              // console.log({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              // drag && setCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            }}
            onClick={() => {
              // drag && setDrag(false);
            }}
            {...mapProps}
            mapContainerClassName={cn(
              "relative",
              mapProps?.mapContainerClassName,
            )}
            onCenterChanged={() => {
              const centered = map?.getCenter();
              if (centered) {
                const location = {
                  lng: centered.lng(),
                  lat: centered.lat(),
                };
                // setCoords(location);
                onCoordsChange?.(location);
                setCoords(location);
              }
              mapProps?.onCenterChanged?.();
            }}
            onLoad={(map) => {
              setMap(map);
              mapProps?.onLoad?.(map);
            }}
          >
            {/* <Marker
              position={{
                lat: map?.getCenter().lat() || coords.lat,
                lng: map?.getCenter().lng() || coords.lng,
              }}
              onClick={() => {
                // setDrag(true);
              }}
            /> */}
            {map && (
              <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2">
                <MapPin className="text-primary size-[30px]" />
              </div>
            )}
          </GoogleMap>
          {/* <p className="err">{error || ""}</p> */}
          <div className="flex gap-2 justify-end">
            <ActionButton
              type="button"
              variant={"secondary"}
              onClick={async () => {
                try {
                  const result = await geocodeLatLng(coords.lat, coords.lng);
                  onGeocodeLatLng?.(result, coords);
                } catch (err) {}
              }}
            >
              <div className="flex gap-2 items-center">
                <NotebookPenIcon />
                Fill Location
              </div>
            </ActionButton>
            <ActionButton
              type="button"
              {...buttonProps}
              className={cn("", buttonProps?.className)}
              onClick={() => updateToCurrentLocation()}
            >
              <div className="flex gap-2 items-center">
                <MapPin /> Current Location
              </div>
            </ActionButton>
          </div>

          {/* Inputs */}
          <div className={`map-inputs-wrap flex flex-wrap gap-4`}>
            <Autocomplete
              className={`search-map-wrap w-full`}
              onLoad={(e) => {
                inputRef.current = e;
              }}
              onPlaceChanged={() => {
                const loc =
                  inputRef.current?.getPlace().geometry?.location || null;
                const lat = loc?.lat();
                const lng = loc?.lng();
                if (lat && lng) {
                  const pos = { lat, lng };
                  //   setCoords(pos);
                  setCenter(pos);
                  setCoords(pos);
                }
              }}
            >
              <Input
                type="text"
                placeholder={"Search any Location"}
                {...searchInputProps}
                className={cn("w-full", searchInputProps?.className)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                  searchInputProps?.onKeyDown?.(e);
                }}
              />
            </Autocomplete>
            <div className="font-bold text-lg text-center w-full"> OR </div>

            {/* Maps url */}
            <div className="w-full flex gap-4">
              <FormField
                labelProps={{ className: "absolute hidden" }}
                wrapperProps={{ className: "w-full" }}
                className="w-full"
                placeholder="Enter maps url"
                type="url"
                onChange={(e) => {
                  const val = e.currentTarget.value.trim();
                  setUrl(val);
                }}
              />
              <ActionButton
                type="button"
                onClick={async () => {
                  onMapsShareURL?.(url);
                  handleMapsURLGeocode(url);
                }}
              >
                <div className="flex gap-2 items-center">
                  <NotebookPenIcon />
                  Check URL
                </div>
              </ActionButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
