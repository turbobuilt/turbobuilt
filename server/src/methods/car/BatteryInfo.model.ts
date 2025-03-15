import { DbObject } from "lib/DbObject.model";
import { bigInt, text, varchar } from "lib/schema";

export class BatteryInfo extends DbObject {
    @text()
    carIdentifier: string;

    // @text()
    // value: string;

    @varchar(200)
    bciGroup: string;

    @bigInt()
    quantity: number;

    @bigInt()
    cca: number;
}