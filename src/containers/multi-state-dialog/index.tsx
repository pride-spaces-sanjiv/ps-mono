import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import ActionButton from "@/components/buttons/action-btn";
import { Plus } from "lucide-react";
import FormField from "@/components/form/field";



export default function MultiState() {
    return(
                    <Dialog>
              <form>
                <DialogTrigger asChild>
                  <ActionButton
                    variant="outline"
                    type="button"
                    className="flex items-center gap-2 px-5 py-5"
                  >
                    <div className="flex gap-2 items-center">
                      Add a state <Plus />
                    </div>
                  </ActionButton>
                </DialogTrigger>

                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add state:</DialogTitle>
                    {/* <DialogDescription>
                      Add description here!
                    </DialogDescription> */}
                  </DialogHeader>

                  <FieldGroup>
                    <FormField
                      label="State"
                      labelPosition="embedded"
                      placeholder="Maharashtra"
                    // {...register("state")}
                    // error={errors?.state}
                    />

                    <FormField
                      label="City"
                      labelPosition="embedded"
                      placeholder="Mumbai"
                    //  {...register("city")}
                    //  error={errors?.city}
                    />
                    <FormField
                      label="Branch Address"
                      labelPosition="embedded"
                      inputType="textarea"
                    // {...register("location.branchAddress")}
                    // error={errors.location?.branchAddress}
                    />
                    <FormField
                      label="GST Number"
                      labelPosition="embedded"
                      placeholder="Enter GST Number"
                    //   {...register("gstNo")}
                    //   error={errors?.gstNo}
                    />
                  </FieldGroup>

                  <DialogFooter>
                    <DialogClose asChild>
                      <ActionButton variant="outline">Cancel</ActionButton>
                    </DialogClose>
                    <ActionButton type="submit">Save changes</ActionButton>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
    )
}
