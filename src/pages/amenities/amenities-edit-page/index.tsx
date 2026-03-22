import { operatorSchema } from "@/utils/schemas/operators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, defaultValues },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(operatorSchema.omit({ password: true })),
  });

export default function AmenitiesEditPage(){
    return(
            <div className="container mx-auto p-6">
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">
            This Amenity Edit Page
            {/* {watch("name", "")} */}
            </h1>
      </div>
      <div className="w-full max-w-4xl mx-auto py-8"></div>
      </div>
    )
}