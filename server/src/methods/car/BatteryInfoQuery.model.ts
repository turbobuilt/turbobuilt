import { DbObject } from "lib/DbObject.model";
import { text, varchar } from "lib/schema";

export class BatteryInfoQuery extends DbObject {
    @varchar(250)
    ipAddress: string;
}