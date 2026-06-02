import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";

export const useZodForm = <TValues extends FieldValues>(
  schema: z.ZodTypeAny,
  options?: Omit<UseFormProps<TValues>, "resolver">,
): UseFormReturn<TValues> => {
  return useForm<TValues>({
    resolver: zodResolver(schema as never) as Resolver<TValues>,
    mode: "onTouched",
    ...options,
  });
};
