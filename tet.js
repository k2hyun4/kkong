const scriptName = 'tet1';
const fs = FileStream;
const DB_PATH = 'sdcard/bot/db/schedule.txt';
const ORDER_ROOT = '..꽁 ';
const ORDER_ADD = '추가';
const ORDER_REMOVE = '삭제';
const ORDER_TODAY = '오늘';
const ORDER_SCHEDULE = '일정';
const ORDER_RESET = '초기화';
const ORDER_HELP = '헬프';
const ORDER_ADVICE = '도움';
const ORDER_FUNCTION = '기능';
const SEPARATOR_ADD = '=';
const INVALID_DATE = '날짜를 제대로 입력해주세요';
const NON_SCHEDULE = '예정된 방탈이 없습니다.\n분발하세요 cde!';
const REGEX_DATE = /^(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[0-1])$/;
const EXAMPLE_ADD = 'ex)\n..꽁 추가 1009=홍대\n10:30 하이팜\n12:00 거상';
//let gTodayKey = {};

if (!fs.read(DB_PATH)) {
    fs.write(DB_PATH, '{}');
}

let db = JSON.parse(fs.read(DB_PATH));

function updateDb() {
    fs.write(DB_PATH, JSON.stringify(db));
}

function response(room, msg, sender, isGroupChat, replier) {
    let response = '';

    if (db[room] == undefined) {
        db[room] = {};
    }

    if (!msg.startsWith(ORDER_ROOT)) {
        /**
         * 그 날 첫 카톡에 반응, 그 날 일정 출력
         * 실사용 폰과 봇용 폰이 동일하므로 일단 사용 불가
         */
        // let todayKey = getNowDateStr();

        // if (gTodayKey[room] == undefined || todayKey > gTodayKey[room]) {
        //     response = checkSchedule(todayKey, room) 
        //         ? getSchedule(todayKey, room)
        //         : NON_SCHEDULE;

        //     replier.reply(response);
        //     gTodayKey[room] = todayKey;
        // }

        return;
    }

    msg = msg.substr(ORDER_ROOT.length);

    if (msg === ORDER_SCHEDULE) {
        response = all(room);
    } else if (msg === ORDER_HELP || msg === ORDER_ADVICE || msg === ORDER_FUNCTION) {
        response = help();
    } else if (msg === ORDER_RESET) {
        response = reset(room);
    } else if (msg.startsWith(ORDER_ADD)) {
        response = add(room, msg);
    } else if (msg.startsWith(ORDER_RESET)) {
        response = remove(room, msg);
    } else {        //특정일 or 오늘 일정
        if (msg != ORDER_TODAY && !REGEX_DATE.test(msg)) {
            return;
        }
        
        const dateKey = msg === ORDER_TODAY ? getNowDateStr() : addYear(msg);
        response = checkSchedule(dateKey, room);
    }

    replier.reply(response);
}

function getNowDateStr() {
    const now = new Date();
    let month = now.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    let date = now.getDate();
    date = date < 10 ? '0' + date : date;
    
    return '' + now.getFullYear() + month + date;
}

function addYear(inputDate) {
    const nowStr = getNowDateStr();
    const nowYear = nowStr.substr(0, 4);

    if (nowStr.substr(4) > inputDate) {
        return Number(nowYear) + 1 + inputDate;
    } else {
        return nowYear + inputDate;
    }
}

function convertDate(inputDate) {
    return inputDate.substr(4, 2) + '월 ' + inputDate.substr(6) + '일';
}

function checkSchedule(dateKey, room) {
    const hasSchedule = Object.keys(db[room])
        .includes(dateKey)
        .valueOf();

    return hasSchedule ? getSchedule(dateKey, room) : NON_SCHEDULE;
}

function getSchedule(dateKey, room) {
    return convertDate(dateKey) + '\n' + db[room][dateKey];
}

function help() {
    return '[일정 추가하기]\n..꽁 추가 MMDD=[내용]\n' + EXAMPLE_ADD
            + '\n\n[오늘 일정]]\n..꽁 오늘'
            + '\n\n[일정 삭제하기]\n..꽁 삭제 MMDD'
            + '\n\n[전체 조회하기]\n..꽁 일정'
            + '\n\n[하루 조회하기]\n..꽁 MMDD';
}

function getAddRemoveDateKey(msg) {
    const orderSepatatorIndex = msg.indexOf(' ');

    return orderSepatatorIndex < 0 ? false : msg.substr(orderSepatatorIndex + 1);
}

function add(room, msg) {
    const dateKey = getAddRemoveDateKey(msg);
    const errorMsg = '날짜=내용 형식으로 입력해주세요. ' + EXAMPLE_ADD;

    if (dateKey == false) {
        return errorMsg;
    }

    const msgs = dateKey.split(SEPARATOR_ADD);

    if (msgs.length != 2) {
        return errorMsg;
    }

    const inputDate = msgs[0];

    if (!REGEX_DATE.test(inputDate)) {
        return INVALID_DATE;
    }

    db[room][addYear(inputDate)] = msgs[1];
    updateDb();

    return msgs[0] + ' : ' + msgs[1] + '\n저장 완료';
}

function remove(room, msg) {
    const dateKey = getAddRemoveDateKey(msg);
    
    if (dateKey == false) {
        return '삭제 실패';
    }

    if (!REGEX_DATE.test(dateKey)) {
        return INVALID_DATE;
    }

    delete db[room][addYear(dateKey)];
    updateDb();

    return dateKey + ' 삭제 완료';
}

function reset(room) {
    /**
     * 현재 불필요, 기능 막아둠
     */
    // db[room] = {};
    // updateDb();
    // response = '초기화 완료';
}

/**
 * 미래 일정만 나오도록 수정
 */
function all(room) {
    const futureList = [];
    const nowDateStr = getNowDateStr();

    for (let inputDate in db[room]) {
        // 미래건만 추림
        if (inputDate < nowDateStr) {
            continue;
        }

        futureList.push(inputDate);
    }

    if (futureList.length == 0) {
        return '남은 일정이 없습니다.';
    }

    return futureList.sort()
        .map(date => convertDate(date) + '\n' + db[room][date])
        .join('\n\n');
}

function removePast(room) {
    //TODO
}

function onStartCompile() {
    updateDb();
}
