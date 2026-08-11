import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useState } from "react";

export default function AddSpaceDialog() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    state: "",
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    console.log("New Space:", form);
  };

  return (
    <Dialog>

      <DialogTrigger asChild>
        <Button>Add Space</Button>
      </DialogTrigger>

      <DialogContent>

        <DialogHeader>
          <DialogTitle>Add Space</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">

          <Input
            placeholder="Space Name"
            name="name"
            onChange={handleChange}
          />

          <Input
            placeholder="Email"
            name="email"
            onChange={handleChange}
          />

          <Input
            placeholder="City"
            name="city"
            onChange={handleChange}
          />

          <Input
            placeholder="State"
            name="state"
            onChange={handleChange}
          />

          <div className="flex justify-end">
            <Button onClick={handleSubmit}>
              Save
            </Button>
          </div>

        </div>

      </DialogContent>

    </Dialog>
  );
}