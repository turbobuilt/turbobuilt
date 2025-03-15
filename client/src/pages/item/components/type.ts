import { serverMethods } from "@/lib/serverMethods";

export type ItemPropertyInfo = Awaited<ReturnType<typeof serverMethods.itemProperty.getItemPropertiesForItem>>['data']['itemProperties'][0];
