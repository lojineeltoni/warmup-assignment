const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {

    function changeToSeconds(time) {
        let parts = time.split(" ");
        let clock = parts[0];
        let period = parts[1];

        let timeParts = clock.split(":");
        let hours = Number(timeParts[0]);
        let minutes = Number(timeParts[1]);
        let seconds = Number(timeParts[2]);

        if (period == "pm" && hours != 12) {
            hours = hours + 12;
        }

        if (period == "am" && hours == 12) {
            hours = 0;
        }

        return hours * 3600 + minutes * 60 + seconds;
    }

    let start = changeToSeconds(startTime);
    let end = changeToSeconds(endTime);

    if (end < start) {
        end = end + 24 * 3600;
    }

    let total = end - start;

    let hours = Math.floor(total / 3600);
    let minutes = Math.floor((total % 3600) / 60);
    let seconds = total % 60;

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return hours + ":" + minutes + ":" + seconds;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {

    function toSeconds(time) {
        let parts = time.split(" ");
        let clock = parts[0];
        let period = parts[1];

        let timeParts = clock.split(":");
        let hours = Number(timeParts[0]);
        let minutes = Number(timeParts[1]);
        let seconds = Number(timeParts[2]);

        if (period == "pm" && hours != 12) {
            hours = hours + 12;
        }

        if (period == "am" && hours == 12) {
            hours = 0;
        }

        return hours * 3600 + minutes * 60 + seconds;
    }

    let start = toSeconds(startTime);
    let end = toSeconds(endTime);

    let startDelivery = 8 * 3600;
    let endDelivery = 22 * 3600;

    let idle = 0;

    if (start < startDelivery) {
        if (end <= startDelivery) {
            idle = idle + (end - start);
        } else {
            idle = idle + (startDelivery - start);
        }
    }

    if (end > endDelivery) {
        if (start >= endDelivery) {
            idle = idle + (end - start);
        } else {
            idle = idle + (end - endDelivery);
        }
    }

    let hours = Math.floor(idle / 3600);
    let minutes = Math.floor((idle % 3600) / 60);
    let seconds = idle % 60;

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return hours + ":" + minutes + ":" + seconds;
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
// refined total active hours calculation
    function toSeconds(time) {
        let parts = time.split(":");
        let hours = Number(parts[0]);
        let minutes = Number(parts[1]);
        let seconds = Number(parts[2]);

        return hours * 3600 + minutes * 60 + seconds;
    }

    let shift = toSeconds(shiftDuration);
    let idle = toSeconds(idleTime);
    let active = shift - idle;

    let hours = Math.floor(active / 3600);
    let minutes = Math.floor((active % 3600) / 60);
    let seconds = active % 60;

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return hours + ":" + minutes + ":" + seconds;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {

    let parts = activeTime.split(":");
    let hours = Number(parts[0]);
    let minutes = Number(parts[1]);
    let seconds = Number(parts[2]);

    let totalSeconds = hours * 3600 + minutes * 60 + seconds;

    let requiredSeconds = 8 * 3600 + 24 * 60;

    if (date >= "2025-04-10" && date <= "2025-04-30") {
        requiredSeconds = 6 * 3600;
    }

    if (totalSeconds >= requiredSeconds) {
        return true;
    } else {
        return false;
    }
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {

    const fs = require("fs");

    let data = fs.readFileSync(textFile, "utf8");
    let lines = data.trim().split("\n");

    let driverID = shiftObj.driverID;
    let driverName = shiftObj.driverName;
    let date = shiftObj.date;
    let startTime = shiftObj.startTime;
    let endTime = shiftObj.endTime;

    for (let i = 0; i < lines.length; i++) {

        let parts = lines[i].split(",");

        if (parts[0] == driverID && parts[2] == date) {
            return {};
        }
    }

    let shiftDuration = getShiftDuration(startTime, endTime);
    let idleTime = getIdleTime(startTime, endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let quota = metQuota(date, activeTime);

    let newLine =
        driverID + "," +
        driverName + "," +
        date + "," +
        startTime + "," +
        endTime + "," +
        shiftDuration + "," +
        idleTime + "," +
        activeTime + "," +
        quota + "," +
        false;

    lines.push(newLine);

    fs.writeFileSync(textFile, lines.join("\n"));

    return {
        driverID: driverID,
        driverName: driverName,
        date: date,
        startTime: startTime,
        endTime: endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quota,
        hasBonus: false
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {

    const fs = require("fs");

    let data = fs.readFileSync(textFile, "utf8");
    let lines = data.trim().split("\n");

    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");

        if (parts[0] == driverID && parts[2] == date) {
            parts[9] = String(newValue);
            lines[i] = parts.join(",");
            break;
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {

    const fs = require("fs");

    let data = fs.readFileSync(textFile, "utf8");
    let lines = data.trim().split("\n");

    let count = 0;
    let found = false;
    let inputMonth = Number(month);

    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");

        let id = parts[0].trim();
        let date = parts[2].trim();
        let bonus = parts[9].trim();

        let dateParts = date.split("-");
        let recordMonth = Number(dateParts[1]);

        if (id == driverID) {
            found = true;

            if (recordMonth == inputMonth && bonus == "true") {
                count++;
            }
        }
    }

    if (found == false) {
        return -1;
    }

    return count;
}
// improved handling of monthly driver hours calculation
function getTotalActiveHoursPerMonth(textFile, driverID, month) {

    const fs = require("fs");

    let data = fs.readFileSync(textFile, "utf8");
    let lines = data.trim().split("\n");

    let totalSeconds = 0;

    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");

        let id = parts[0];
        let date = parts[2];
        let activeTime = parts[7];

        let dateParts = date.split("-");
        let recordMonth = Number(dateParts[1]);

        if (id == driverID && recordMonth == month) {
            let timeParts = activeTime.split(":");
            let hours = Number(timeParts[0]);
            let minutes = Number(timeParts[1]);
            let seconds = Number(timeParts[2]);

            totalSeconds = totalSeconds + hours * 3600 + minutes * 60 + seconds;
        }
    }

    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return hours + ":" + minutes + ":" + seconds;
}
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) //
//  textFile: (typeof string) path to shifts text file //
//  rateFile: (typeof string) path to driver rates text file //
//  bonusCount: (typeof number) total bonuses for given driver per month //
//  driverID: (typeof string) // month: (typeof number) // Returns: string formatted as hhh:mm:ss //
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {

    const fs = require("fs");

    let shiftData = fs.readFileSync(textFile, "utf8");
    let shiftLines = shiftData.trim().split("\n");

    let rateData = fs.readFileSync(rateFile, "utf8");
    let rateLines = rateData.trim().split("\n");

    let dayOff = "";

    for (let i = 0; i < rateLines.length; i++) {
        let parts = rateLines[i].split(",");

        if (parts[0] == driverID) {
            dayOff = parts[1];
            break;
        }
    }

    let totalSeconds = 0;

    for (let i = 0; i < shiftLines.length; i++) {
        let parts = shiftLines[i].split(",");

        let id = parts[0];
        let date = parts[2];

        let dateParts = date.split("-");
        let recordMonth = Number(dateParts[1]);

        if (id == driverID && recordMonth == month) {

            let dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

            if (dayName != dayOff) {

                let requiredForDay = 8 * 3600 + 24 * 60;

                if (date >= "2025-04-10" && date <= "2025-04-30") {
                    requiredForDay = 6 * 3600;
                }

                totalSeconds = totalSeconds + requiredForDay;
            }
        }
    }

    totalSeconds = totalSeconds - bonusCount * 2 * 3600;

    if (totalSeconds < 0) {
        totalSeconds = 0;
    }

    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    return hours + ":" + minutes + ":" + seconds;
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {

    const fs = require("fs");

    let data = fs.readFileSync(rateFile, "utf8");
    let lines = data.trim().split("\n");

    let basePay = 0;
    let tier = 0;

    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");

        if (parts[0] == driverID) {
            basePay = Number(parts[2]);
            tier = Number(parts[3]);
            break;
        }
    }

    function toSeconds(time) {
        let parts = time.split(":");
        let hours = Number(parts[0]);
        let minutes = Number(parts[1]);
        let seconds = Number(parts[2]);

        return hours * 3600 + minutes * 60 + seconds;
    }

    let actual = toSeconds(actualHours);
    let required = toSeconds(requiredHours);

    if (actual >= required) {
        return basePay;
    }

    let missingSeconds = required - actual;

    let allowedHours = 0;

    if (tier == 1) {
        allowedHours = 50;
    } else if (tier == 2) {
        allowedHours = 20;
    } else if (tier == 3) {
        allowedHours = 10;
    } else if (tier == 4) {
        allowedHours = 3;
    }

    let allowedSeconds = allowedHours * 3600;
    let remainingMissing = missingSeconds - allowedSeconds;

    if (remainingMissing < 0) {
        remainingMissing = 0;
    }

    let billableMissingHours = Math.floor(remainingMissing / 3600);

    let deductionRatePerHour = Math.floor(basePay / 185);
    let salaryDeduction = billableMissingHours * deductionRatePerHour;

    let netPay = basePay - salaryDeduction;

    return netPay;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
