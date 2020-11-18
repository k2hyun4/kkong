const scriptName = 'tet1';
const fs = FileStream;
const DB_PATH = 'sdcard/bot/db/schedule.txt';
const ORDER_ROOT = '..꽁 ';
const ORDER_ADD = '추가';
const ORDER_REMOVE = '삭제';
const ORDER_SCHEDULE = '일정';
const ORDER_RESET = '초기화';
const ORDER_HELP = '기능';
const SEPARATOR_ADD = '=';
const INVALID_DATE = '날짜를 제대로 입력해주세요';
const REGEX_DATE = /^(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[0-1])$/;
const EXAMPLE_ADD = 'ex)\n..꽁 추가 1009=홍대\n10:30 하이팜\n12:00 거상';

if (!fs.read(DB_PATH)) {
    fs.write(DB_PATH, '{}');
}

let db = JSON.parse(fs.read(DB_PATH));

function updateDb() {
    fs.write(DB_PATH, JSON.stringify(db));
}

function response(room, msg, sender, isGroupChat, replier) {
    if (!msg.startsWith(ORDER_ROOT)) {
        return;
    }

    if (db[room] == undefined) {
        db[room] = {};
    }

    msg = msg.substr(ORDER_ROOT.length);
    let response = '';
    let dateKey = addYear(msg);

    //단일 일정 조회
    if (Object.keys(db[room]).includes(dateKey).valueOf()) {
        response = convertDate(dateKey) + '\n' + db[room][dateKey];
    } else if (msg == ORDER_SCHEDULE) {     //전체 일정 조회
        response = all(room);
    } else if (msg == ORDER_RESET) {        //초기화
        db[room] = {};
        updateDb();
        response = '초기화 완료';
    } else if (msg == ORDER_HELP) {     // 안내
        response = '[일정 추가하기]\n..꽁 추가 MMDD=[내용]\n' + EXAMPLE_ADD
            + '\n\n[일정 삭제하기]\n..꽁 삭제 MMDD'
            + '\n\n[전체 조회하기]\n..꽁 일정'
            + '\n\n[하루 조회하기]\n..꽁 MMDD';
    } else {
        const orderSepatatorIndex = msg.indexOf(' ');

        if (orderSepatatorIndex < 0) {
            return;
        } else {
            const checker = msg.substr(0, orderSepatatorIndex);
            msg = msg.substr(orderSepatatorIndex + 1);
        
            switch (checker) {
                case ORDER_ADD: 
                    response = add(room, msg);
                    break;
                case ORDER_REMOVE:
                    response = remove(room, msg);
                    break;
            }
        }
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

function add(room, msg) {
    const msgs = msg.split(SEPARATOR_ADD);

    if (msgs.length != 2) {
        return '날짜=내용 형식으로 입력해주세요. ' + EXAMPLE_ADD;
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
    if (!REGEX_DATE.test(msg)) {
        return INVALID_DATE;
    }

    delete db[room][addYear(msg)];
    updateDb();

    return msg + ' 삭제 완료';
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