let inputCon = document.querySelector('.input-container');
let scoreBoard = document.querySelector('.score-container');
let team1Input = document.getElementById('team1');
let team1NameElem = document.getElementById('team1Name');
let team1ScoreElem = document.getElementById('team1Score');
let team2Input = document.getElementById('team2');
let team2NameElem = document.getElementById('team2Name');
let team2ScoreElem = document.getElementById('team2Score');

// セットポイント
let team1SetElem = document.getElementById('team1Set');
let team2SetElem = document.getElementById('team2Set');
let team1Set = 0;
let team2Set = 0;

// 録画
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;


function startGame() {
    let team1Name = team1Input.value;
    let team2Name = team2Input.value;
    
    if (team1Name.trim() === '' || team2Name.trim() === '') {
        alert('Please enter team names for both teams.');
        return;
    }

    inputCon.style.display = 'none';
    scoreBoard.style.display = '';
    team1NameElem.textContent = team1Name;
    team2NameElem.textContent = team2Name;
}

function addScore(points, team) {
    let scoreElem = team === 'team1' ? team1ScoreElem : team2ScoreElem;
    let currentScore = parseInt(scoreElem.textContent);
    scoreElem.textContent = currentScore + points;
}

function resetScore() {
    team1ScoreElem.textContent = '0';
    team2ScoreElem.textContent = '0';
}

function resetGame() {
    inputCon.style.display = 'flex';
    scoreBoard.style.display = 'none';
    team1Input.value = '三中';
    team2Input.value = '対戦相手';
    team1NameElem.textContent = '1';
    team2NameElem.textContent = '2';
    resetScore();
}

// セットポイント
function addSetPoint(points, team) {
    if (team === 'team1') {
        team1Set += points;
        team1SetElem.textContent = team1Set;
    } else if (team === 'team2') {
        team2Set += points;
        team2SetElem.textContent = team2Set;
    }
}

// 録画(非同期処理)
async function startRecording() {
    const scoreBoardWrapper = document.querySelector('.score-board-wrapper');
    const canvas = await html2canvas(scoreBoardWrapper);
    const stream = canvas.captureStream(30); // 30 FPS

    console.log("Stream before starting recording:", stream);

    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    // 録画中に定期的にCanvasを更新する
    const interval = setInterval(() => {
        html2canvas(scoreBoardWrapper).then(updatedCanvas => {
            // ここでCanvasを更新
            const ctx = canvas.getContext('2d'); // 初期Canvasのコンテキストを取得
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 古い内容をクリア
            ctx.drawImage(updatedCanvas, 0, 0); // 新しいキャプチャを描画
        });
    }, 1000 / 30); // 30fpsでキャプチャ

    mediaRecorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
            console.log('データを取得しました:', event.data);
        } else {
            console.log('データが空です:', event.data);
        }
    };

    mediaRecorder.onstop = function () {
        console.log("録画が停止しました");
        clearInterval(interval); // タイマーをクリア
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'score-video.webm'; // 保存するファイル名
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        recordedChunks = []; // チャンクをリセット
    };

    mediaRecorder.start();
    console.log("録画を開始しました");
}

// 録画停止
function stopRecording() {
    return new Promise(resolve => {
        mediaRecorder.onstop = () => {
            console.log("録画が停止しました");
            const blob = new Blob(recordedChunks, { type: 'video/webm' });// 録画データをBlobに変換
            const url = URL.createObjectURL(blob);
            recordedChunks = []; // 配列をリセット
            resolve(url); // 録画終了後にURLを返す
        };
        mediaRecorder.stop();  // 録画を停止
        console.log("録画停止を呼び出しました");
    });
}


function toggleRecording() {
    isRecording = !isRecording;
    const recordButton = document.getElementById('recordButton');

    if (isRecording) {
        recordButton.classList.add('recording');
        recordButton.textContent = '録画停止';
        startRecording(); // 録画を開始
    } else {
        recordButton.classList.remove('recording');
        recordButton.textContent = '録画開始';
		stopRecording().then(url => {
            console.log('録画が完了しました。録画データのURL:', url);
			const a = document.createElement('a');
			a.style.display = 'none';
			a.href = url; // ここに録画データのURLを設定
			a.download = 'score-video.webm'; // 保存するファイル名
			document.body.appendChild(a);
			a.click(); // 自動的にクリックしてダウンロードを開始
			URL.revokeObjectURL(url); // 一時URLを解放
        });
    }
}
