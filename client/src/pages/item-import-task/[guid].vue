<script lang="ts" setup>
import { onMounted, reactive, ref } from "vue"
import ItemPropertyTypeSelector from "../item/components/components/components/ItemPropertyTypeSelector.vue";
import { showAlert, showConfirm } from "@/components/ShowModal/showModal";
import { serverMethods } from "@/lib/serverMethods";
import { checkAndShowHttpError } from "@/lib/checkAndShowHttpError";
import { ItemImportTask } from "@/serverTypes/itemImport/ItemImportTask.model";
import router from "@/router/router";

const d = reactive(makeState());

function makeState() {
    return {
        csv: null,
        headersData: null,
        nameColumnIndex: null,
        importing: false,
        success: false,
        selectedWebsite: null,
        importedCount: 0,
        websites: null,
        itemImportTask: null as ItemImportTask,
        rollingBack: false,
        loading: false
    };
}
function clear() {
    Object.assign(d, makeState());
}

onMounted(() => {
    getItemImportTask();
});

async function getItemImportTask() {
    if (router.currentRoute.value.params.guid === "new") {
        d.itemImportTask = new ItemImportTask();
    } else {
        d.loading = true;
        let result = await serverMethods.itemImportTask.getItemImportTask(router.currentRoute.value.params.guid as string);
        d.loading = false;
        if (checkAndShowHttpError(result)) {
            return;
        }
        d.itemImportTask = result.data;
    }
}

const fileInputContainer = ref(null);
async function showFileSelect() {
    if (d.importing) {
        return;
    }
    d.success = false;
    d.importedCount = 0;
    d.importing = true;
    let fileInput = document.createElement("input");
    let websitesResult = await serverMethods.website.getWebsiteList({ page: 1, perPage: 1000 });
    d.websites = websitesResult.data.items;
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.onchange = async () => {
        try {
            let file = fileInput.files[0];
            if (!file) {
                return;
            }
            let reader = new FileReader();
            reader.onload = async () => {
                try {
                    let text = (reader.result as string).trim().replace(/,$/, "");
                    let lines = text.split("\n");
                    let headers = lines[0].split(",");
                    let items = [];
                    for (let i = 1; i < lines.length; i++) {
                        let line = lines[i];
                        let values = line.split(",");
                        let item = {};
                        for (let j = 0; j < headers.length; j++) {
                            item[headers[j]] = values[j];
                        }
                        items.push(item);
                    }
                    function parseCSVContent(csvText) {
                        const entries = [];
                        let currentEntry = [];
                        let currentField = '';
                        let insideQuotes = false;

                        for (let i = 0; i < csvText.length; i++) {
                            const char = csvText[i];

                            if (char === '"') {
                                if (insideQuotes && csvText[i + 1] === '"') {
                                    currentField += '"';
                                    i++;
                                } else {
                                    insideQuotes = !insideQuotes;
                                }
                            } else if (char === ',' && !insideQuotes) {
                                currentEntry.push(currentField);
                                currentField = '';
                            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                                if (csvText[i + 1] === '\r' || csvText[i + 1] === '\n') i++;
                                currentEntry.push(currentField);
                                currentField = '';
                                entries.push(currentEntry);
                                currentEntry = [];
                            } else {
                                currentField += char;
                            }
                        }
                        currentEntry.push(currentField);
                        entries.push(currentEntry);

                        const headers = entries.shift();
                        items = entries.map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index];
                            });
                            return obj;
                        });
                    }
                    parseCSVContent(text);

                    // now check if any columns are number columns
                    // it's a number column if ALL values are either null or valid numbers
                    let numberColumns = [];
                    for (let header of headers) {
                        let isNumberColumn = true;
                        for (let item of items) {
                            if (item[header] !== null && item[header] !== undefined && isNaN(Number(item[header])) && item[header] !== "") {
                                isNumberColumn = false;
                                break;
                            }
                        }
                        if (isNumberColumn) {
                            numberColumns.push(header);
                        }
                    }
                    // for all number columns, run parseFloat on all values
                    for (let header of numberColumns) {
                        for (let item of items) {
                            item[header] = parseFloat(item[header]) || null;
                        }
                    }
                    let headerData: { text: string, inputType: string, itemPropertyType: string }[] = reactive([])
                    for (let header of headers) {
                        let inputType = "text";
                        if (numberColumns.includes(header)) {
                            inputType = "number";
                        }
                        headerData.push({ text: header, inputType, itemPropertyType: null });
                    }
                    d.headersData = headerData;
                    d.csv = items;
                    // check if any colum trim to lower is name
                    for (let i = 0; i < headers.length; i++) {
                        let header = headers[i];
                        if (header.toLowerCase().trim() === "name") {
                            d.nameColumnIndex = i;
                            break;
                        }
                    }
                    let itemPropertyTypesResult = await serverMethods.itemPropertyType.getItemPropertyTypeList();
                    let itemPropertyTypes = itemPropertyTypesResult.data.itemPropertyTypes;
                    // for each header, check if there is a matching item property type Text or Number
                    for (let headerDataItem of headerData) {
                        if (headerDataItem.inputType === "text") {
                            let itemPropertyType = itemPropertyTypes.find(ipt => ipt.name === "Text");
                            headerDataItem.itemPropertyType = itemPropertyType.guid;
                        } else if (headerDataItem.inputType === "number") {
                            let itemPropertyType = itemPropertyTypes.find(ipt => ipt.name === "Number");
                            headerDataItem.itemPropertyType = itemPropertyType.guid;
                        }
                    }
                    console.log("header data", d.headersData);
                    console.log(items);
                } catch (e) {
                    console.error(e);
                    showAlert("Error parsing CSV file " + e.message);
                } finally {
                    d.importing = false;
                }
            }
            reader.readAsText(file);
        } catch (e) {
            console.error(e);
            showAlert("Error parsing CSV file " + e.message);
        } finally {
            d.importing = false;
        }
    }
    fileInput.click();
    // remove
    fileInput.remove();
}

async function doImport() {
    // verify itemPropertyType is selected for all headers
    for (let headerData of d.headersData) {
        if (!headerData.itemPropertyType) {
            showAlert("Please select an item property type for all columns");
            return;
        }
    }
    // now send the data to the server
    console.log(d.csv);
    console.log(d.headersData);
    d.importing = true;
    let result = await serverMethods.itemImportTask.startItemImportTask(d.csv, d.headersData, d.nameColumnIndex, d.selectedWebsite);
    if (checkAndShowHttpError(result)) {
        d.importing = false;
        return;
    }
    clear();
    d.success = true;
    d.importedCount = result.data.items.length;
    d.itemImportTask = result.data.itemImportTask;
}

async function rollbackItemImportTask() {
    if (d.rollingBack) {
        return;
    }
    if (!await showConfirm({ title: "Rollback", content: "Are you sure you want to rollback this import and undo all changes?" })) {
        return;
    }
    d.rollingBack = true;
    let result = await serverMethods.itemImportTask.rollbackItemImportTask(d.itemImportTask.guid);
    d.rollingBack = false;
    if (checkAndShowHttpError(result)) {
        return;
    }
    clear();
    d.itemImportTask = null;
}

</script>
<template>
    <MainMenu />
    <div class="item-import-page" v-if="d.itemImportTask?.guid">
        <div v-if="d.itemImportTask.rolledBack">
            <div>Import rolled back</div>
        </div>
        <div v-else>
            <div v-if="d.success" style="padding: 10px 0px;">
                <div>Import successful!</div>
                <!-- <div>{{ d.importedCount }} items imported</div> -->
            </div>
            <div>Import completed</div>
            <v-btn @click="rollbackItemImportTask()" color="primary">
                <div v-if="!d.rollingBack">Rollback</div>
                <v-progress-circular v-else indeterminate color="white" />
            </v-btn>
        </div>
    </div>
    <div class="item-import-page" v-else-if="d.itemImportTask">
        <v-btn color="primary" ref="fileInputContainer" @click="showFileSelect" v-if="!d.csv">Select CSV File</v-btn>
        <v-btn @click="clear" v-else>Clear</v-btn>
        <div v-if="d.csv">
            <div style="display: flex; align-items: center; padding: 5px;">
                <div style="margin-right: 10px;">Name Column</div>
                <div>
                    <select v-model="d.nameColumnIndex" style="border: 1px solid gray; padding: 5px;">
                        <option value=""></option>
                        <option v-for="(headerData, headerIndex) in d.headersData" :value="headerIndex">{{ headerData.text }}</option>
                    </select>
                </div>
            </div>
            <div style="display: flex; align-items: center; padding: 5px;">
                <div style="margin-right: 10px;">Website</div>
                <div>
                    <select v-model="d.selectedWebsite" style="border: 1px solid gray; padding: 5px;">
                        <option value=""></option>
                        <option v-for="website in d.websites" :value="website.guid">{{ website.name }}</option>
                    </select>
                </div>
            </div>
            <table v-if="d.nameColumnIndex !== null">
                <tr>
                    <th>Column</th>
                    <th>Sample Value</th>
                    <th>Parsed Type</th>
                    <th>System Type</th>
                </tr>
                <tr v-for="(headerData, headerIndex) in d.headersData">
                    <td>{{ headerData.text }}</td>
                    <td>{{ d.csv[0][headerData.text] }}</td>
                    <td>{{ headerData.inputType }}</td>
                    <td>
                        <ItemPropertyTypeSelector v-model="headerData.itemPropertyType" v-if="headerIndex !== d.nameColumnIndex" :omit="['Images']" />
                        <div v-else>NAME</div>
                    </td>
                </tr>
            </table>
            <br>
            <v-btn @click="doImport" color="primary">
                <div v-if="!d.importing">Import</div>
                <v-progress-circular v-else indeterminate color="white" />
            </v-btn>
            <!-- <div v-for="item in d.csv" :key="item.id">
                <div v-for="(value, key) in item" :key="key">{{ key }}: {{ value }}</div>
            </div> -->
        </div>
    </div>
</template>
<style lang="scss">
.item-import-page {
    padding: 15px;
    table {
        border-collapse: collapse;
    }
    th, td {
        text-align: left;
        padding: 5px;
    }
    tr:nth-child(even) {
        background-color: #f2f2f2;
    }
}
</style>