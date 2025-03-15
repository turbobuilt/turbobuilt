function replaceOrg(query) {

}

originalQuery = `SELECT tool.*, 
DATE_FORMAT(calibration.date,'%m/NaN/%Y') as last_calibrated, 
DATE_ADD(calibration.date, INTERVAL SUBSTRING_INDEX(tool.calibration_interval,' ',1) month) as calibration_next_due_raw,
DATE_FORMAT(DATE_ADD(calibration.date, INTERVAL SUBSTRING_INDEX(tool.calibration_interval,' ',1) month), '%m/%d/%Y') as calibration_next_due,
DATE_FORMAT(inspection.date,'%m/%d/%Y') as last_inspected, 
DATE_ADD(inspection.date, INTERVAL SUBSTRING_INDEX(tool.inspection_interval,' ',1) month) as inspection_next_due_raw,
DATE_FORMAT(DATE_ADD(inspection.date, INTERVAL SUBSTRING_INDEX(tool.inspection_interval,' ',1) month), '%m/%d/%Y') as inspection_next_due
FROM tool
LEFT JOIN LATERAL (
SELECT date, tool FROM tool_calibration
WHERE tool=tool.guid
ORDER BY date DESC
LIMIT 1
) as calibration ON calibration.tool=tool.guid
LEFT JOIN LATERAL (
SELECT date, tool FROM tool_inspection
WHERE tool=tool.guid
ORDER BY date DESC
LIMIT 1
) as inspection ON inspection.tool=tool.guid
ORDER BY LEAST(IFNULL(calibration_next_due_raw,'5000-01-01'),IFNULL(inspection_next_due_raw,'5000-01-01')) ASC LIMIT 20 OFFSET 0`