export class OrderData extends DbObject {
    cart: ShoppingCart;
    details: any;
    tax?: number;
    total?: number;
    website?: string;
    organization?: string;
    installationDate?: string;
    installationTime?: string;
}
