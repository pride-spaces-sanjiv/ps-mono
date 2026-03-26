import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateAdmin, getAdmin } from "@/services/apis/admin/admins";
import { adminSchema, type AdminSchema } from "@/utils/schemas/user";
import { queryKeys } from "@/utils/query-keys";

import FormField from "@/components/form/field";
import ActionButton from "@/components/buttons/action-btn";
import FormSectionTitle from "@/components/form/section/title";

import { datifyObjectValues } from "@/utils/object/datify";
import { getAdminLowerLevels } from "@/utils/data/admin";

export default function EditAdmin() {
    const navigate = useNavigate();
    const { id = "" } = useParams();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, defaultValues },
        watch,
        setValue,
    } = useForm({
        resolver: zodResolver(adminSchema),
    });

    const { data: res, isFetching } = useQuery({
        queryKey: [queryKeys, "update", id],
        // queryKey: [queryKeys.ADMIN, "update", id],
        queryFn: () => getAdmin({ url: id }),
    });

    const { mutateAsync, isPending: isUpdating } = useMutation({
        mutationKey: [queryKeys, "update", id],
        // mutationKey: [queryKeys.ADMIN, "update", id],
        mutationFn: updateAdmin,
    });

    const onSubmit = async (body: AdminSchema) => {
        try {
            const res = await mutateAsync({
                body,
            });

            if (res.status === 200) {
                toast.success("Admin updated successfully");
                navigate("/team");
                return;
            }
            throw new Error("Invalid response");
        } catch (err) {
            toast.error("Failed to update admin");
        }
    };

    useEffect(() => {
        if (res?.data?.data) {
            const modified = datifyObjectValues(res.data.data, [
                "createdAt",
                "updatedAt",
            ]);

            reset({
                ...modified,
                password: "",
            });
        }
    }, [res?.data]);

    const userLevel = res?.data?.data?.level;

    const levels = useMemo(
        () => (userLevel ? getAdminLowerLevels(userLevel as any) : []),
        [userLevel],
    );

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">{watch("name", "")}</h1>
            </div>

            <div className="w-full max-w-4xl mx-auto py-8">
                <form
                    onSubmit={handleSubmit(onSubmit, (errors) => {
                        console.log("Admin form err", errors);
                    })}
                    className="auto-form-grid"
                >
                    {/* SECTION */}
                    <FormSectionTitle>Edit Member</FormSectionTitle>

                    {/* Name */}
                    <FormField
                        label="Name"
                        placeholder="Tester QA"
                        labelPosition="embedded"
                        {...register("name")}
                        error={errors.name}
                    />

                    {/* Email */}
                    <FormField
                        label="Email"
                        labelPosition="embedded"
                        type="email"
                        placeholder="support@example.com"
                        {...register("email")}
                        error={errors.email}
                    />

                    {/* Username */}
                    <FormField
                        label="Username"
                        labelPosition="embedded"
                        placeholder="john_doe"
                        {...register("username")}
                        error={errors.username}
                    />

                    {/* Password (optional in edit) */}
                    <FormField
                        label="Password"
                        labelPosition="embedded"
                        inputType="password"
                        placeholder="Leave blank to keep same"
                        {...register("password")}
                        error={errors.password}
                    />

                    {/* Phone */}
                    <FormField
                        key={`ph-${defaultValues?.phone}`}
                        label="Phone No"
                        labelPosition="embedded"
                        type="tel"
                        inputMode="tel"
                        inputType="phone"
                        defaultValue={defaultValues?.phone}
                        value={watch("phone")}
                        placeholder="+1-123-456-7890"
                        onChange={(val) => {
                            setValue("phone", val?.toString() || "", {
                                shouldValidate: true,
                            });
                        }}
                        error={errors?.phone}
                    />

                    {/* Level */}
                    <FormField
                        key={`level-${levels.length}`}
                        label="Member Type"
                        labelPosition="embedded"
                        inputType="select"
                        defaultValue={defaultValues?.level}
                        items={levels.map((s) => ({
                            label: s[0].toUpperCase() + s.slice(1).toLowerCase(),
                            value: s,
                        }))}
                        pickerProps={{
                            wrapperProps: {
                                defaultValue: defaultValues?.level,
                                onValueChange: (val) => {
                                    setValue("level", val as any, {
                                        shouldValidate: true,
                                    });
                                },
                            },
                        }}
                    />

                    {/* Submit */}
                    <div className="col-span-full mt-6 flex justify-end">
                        <ActionButton
                            type="submit"
                            loading={isUpdating || isFetching}
                            className="max-w-fit"
                        >
                            Update Member
                        </ActionButton>
                    </div>
                </form>
            </div>
        </div>
    );
}