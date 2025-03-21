import callMethod from "../../lib/callMethod";

export default function getItemCategoryList() {
    return callMethod("itemCategory.getItemCategoryList", [...arguments]) as Promise<{ error?: string, data: { items: any[]; } }>;
};
