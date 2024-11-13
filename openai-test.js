'use strict';

// 先頭を大文字にする単語
const capitalWords = [
  'i',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'japanese',
  'english'
];

/* 各種フォーム要素を取得 */

// 入力された日本語（input要素）
const japanese = document.getElementById('ja');
// 入力完了ボタン（button要素）
const generateBtn = document.getElementById('generate');
// 確定ボタン（button要素）
const answerBtn = document.getElementById('answer');
// やりなおしボタン（button要素）
const resetBtn = document.getElementById('reset');
// 再挑戦ボタン（button要素）
const retryBtn = document.getElementById('retry');
// ×の場合に正解を表示するボタン（button要素）
const correctBtn = document.getElementById('correct');
// 文章生成ボタン（button要素）
const newSentenceBtn = document.getElementById('newSentence');
// 別の文章生成ボタン（button要素）
const anotherSentenceBtn = document.getElementById('anotherSentence');
// ヒントを表示する領域（div要素）
const hintDisplay = document.getElementById('hintArea');
// 解説を表示する領域（div要素）
const explainDisplay = document.getElementById('explainArea');

// 取得した単語の配列
let shuffledWords;
let correctWords;
let correctSentence;
let userSentence;

// ヒントの文章を入れる
let hintSentence;
let falseHintSentence;
let correctHintSentence;

/**
 *  ツール関数
 **/

/* 配列をシャッフルする関数 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ドラッグ＆ドロップの領域などをクリアする関数 */
function clearAreas() {
  const boxes = document.querySelectorAll('.box');
  boxes.forEach((box) => (box.textContent = ''));
  document.getElementById('judge').textContent = '';
}

/* 単語をドラックドロップできる形でHTMLに表示する関数 */
function placeWords() {
  // 英単語を配置するdiv要素
  const wordEn = document.getElementById('randomWord');

  // 各単語を入れるdiv要素を生成
  shuffledWords.forEach((word, index) => {
    const div = document.createElement('div');
    div.textContent = `${word}`;
    div.draggable = 'true';
    div.className = 'english';
    div.id = 'item' + index;
    wordEn.appendChild(div);
  });

  // さきほど生成したdiv要素（英単語）に関連イベントを登録
  const items = document.querySelectorAll('.english');
  for (const item of items) {
    item.addEventListener('dragstart', handleDragStart, false);
    item.addEventListener('dragend', handleDragEnd, false);
  }

  // ドラッグ／ドロップする領域（div要素）に関連イベントを登録
  const boxes = document.querySelectorAll('.box');
  for (const box of boxes) {
    box.addEventListener('dragenter', handleDragEnter, false);
    box.addEventListener('dragleave', handleDragLeave, false);
    box.addEventListener('dragover', handleDragOver, false);
    box.addEventListener('drop', handleDrop, false);
  }
}

// 配列内の英単語を文章化する関数
function arrayToSentence(el) {
  return el.join(' ');
}

/**
 * イベント登録
 **/

/* 日本語入力フォームを監視 */
japanese.addEventListener('input', () => {
  // 空欄では問題生成ボタンを押せないようにする
  if (japanese.value) {
    generateBtn.disabled = false;
  } else {
    generateBtn.disabled = true;
  }
});

/* 問題生成ボタン */
generateBtn.addEventListener('click', async () => {
  // ドラッグ＆ドロップ領域をクリア
  clearAreas();

  //chatGPTにメッセージとChatGPTのAPIキーを指定
  await japaneseToEnglish();
  /* 英文を固定する場合
  correctWords = [
    'a',
    'sequencing',
    'problem',
    'will',
    'be',
    'generated',
    'from',
    'the',
    'Japanese',
    'text',
    'entered',
    'here',
    '.'
  ];
  */

  // 単語の配列をシャッフルする
  shuffledWords = shuffleArray([...correctWords]);

  // 単語を表示
  placeWords();

  // ボタンの表示／非表示
  generateBtn.disabled = true;
  answerBtn.style.display = 'inline';
  resetBtn.style.display = 'inline';

  // ChatGPTを呼び出す
  await hint();
});

/* やりなおすボタン */
resetBtn.addEventListener('click', () => {
  // ドラッグ＆ドロップ領域をクリア
  clearAreas();

  // シャッフル後の単語を配置
  placeWords();
});

/* 確定ボタン */
answerBtn.addEventListener('click', async () => {
  // テキストを保存する配列
  const english = Array.from(document.querySelectorAll('.english'));
  // answerは並び替えた回答
  let answer = english.map((div) => div.textContent);
  console.log(answer);

  // 並び替えた回答とAPIで得た正解とを比較する
  let result = true;
  for (let i = 0; i < correctWords.length; i++) {
    if (correctWords[i] !== answer[i]) {
      result = false;
    }
  }

  userSentence = arrayToSentence(answer);
  console.log(userSentence);

  await judgegpt();

  // 確定とやりなおすのボタンを消す
  answerBtn.style.display = 'none';
  resetBtn.style.display = 'none';

  // 正解か不正解かで表示内容を分岐する
  const judge = document.getElementById('judge');
  if (result) {
    const maru = document.createElement('img');
    maru.src = 'imgs/maru.png';
    judge.appendChild(maru);
    newSentenceBtn.style.display = 'inline';
    await correctHint();
  } else {
    const batsu = document.createElement('img');
    batsu.src = 'imgs/batsu.png';
    judge.appendChild(batsu);
    // 正解の表示／非表示切り替え
    correctBtn.style.display = 'inline';
    const p = document.createElement('p');
    p.textContent = correctSentence;
    // ↓最初から非表示にするため
    p.className = 'hidden';
    judge.insertBefore(p, batsu.nextSibling);
    retryBtn.style.display = 'inline';
    correctBtn.addEventListener('click', () => {
      p.classList.toggle('hidden');
      correctBtn.textContent = '正解を非表示にする';
      if (p.className == 'hidden') {
        correctBtn.textContent = '正解を表示にする';
      }
    });
    await falseHint();
  }
});

/* 再挑戦ボタン */
retryBtn.addEventListener('click', () => {
  // 単語の配列をランダムに並べ直す
  shuffledWords = shuffleArray([...correctWords]);

  // ドラッグ＆ドロップ領域をクリア
  clearAreas();

  // シャッフル後の単語を配置
  placeWords();

  // 解説を消去
  explainDisplay.textContent = '';

  // ボタンの表示／非表示
  retryBtn.style.display = 'none';
  answerBtn.style.display = 'inline';
  resetBtn.style.display = 'inline';
  correctBtn.style.display = 'none';
});

/* 新しい文章を生成するボタン */
newSentenceBtn.addEventListener('click', async () => {
  // 各要素をクリア
  clearAreas();

  // ヒント消去
  hintDisplay.textContent = '';
  explainDisplay.textContent = '';

  // ChatGPTを呼び出す
  await generateSentence();

  // ボタンの表示／非表示
  newSentenceBtn.style.display = 'none';
  generateBtn.disabled = false;
  anotherSentenceBtn.style.display = 'inline';
});

/* 別の文章を生成するボタン */
anotherSentenceBtn.addEventListener('click', async () => {
  // 各要素をクリア
  clearAreas();

  // ヒント消去
  hintDisplay.textContent = '';

  // ChatGPTを呼び出す
  await generateSentence();

  // ボタンの表示／非表示
  generateBtn.disabled = false;
});

/** ドラッグイベントの定義 */

// ドラッグ開始
const handleDragStart = (e) => {
  e.target.classList.add('dragging');

  // ドロップ効果の設定
  e.dataTransfer.effectAllowed = 'move';

  // 転送するデータの設定
  const { id } = e.target;
  e.dataTransfer.setData('application/json', JSON.stringify({ id }));
};

// ドラッグ終了
const handleDragEnd = (e) => e.target.classList.remove('dragging');

// 要素が重なったとき
const handleDragEnter = (e) => {
  // 子要素へのドラッグを制限
  if ([...e.target.classList].includes('english')) {
    return;
  }

  e.target.classList.add('over');
};

// 要素が離れたとき
const handleDragLeave = (e) => e.target.classList.remove('over');

// 要素が重なっているとき
const handleDragOver = (e) => {
  // 要素が重なった際のブラウザ既定の処理を変更
  e.preventDefault();

  // 子要素へのドラッグを制限
  if ([...e.target.classList].includes('english')) {
    // ドラッグ不可のドロップ効果を設定
    e.dataTransfer.dropEffect = 'none';
    return;
  }

  // ドロップ効果の設定
  e.dataTransfer.dropEffect = 'move';
};

// 要素がドロップされたとき
const handleDrop = (e) => {
  // 要素がドロップされた際のブラウザ既定の処理を変更
  e.preventDefault();
  e.target.classList.remove('over');

  // 転送データの取得
  const { id } = JSON.parse(e.dataTransfer.getData('application/json'));

  // ドロップ先に要素を追加する
  e.target.appendChild(document.getElementById(id));
};

/**
 * ChatGPTとの通信
 */

/** ChatGPT：日本語文章から英語文章を生成（翻訳） */
const japaneseToEnglish = async () => {
  // チャットの初期メッセージを定義
  const messages = [
    {
      role: 'system', //役割
      //      content: '日本語を英語に訳して下さい。'
      content:
        'あなたは日本語を英語に変換する翻訳者です。与えられた日本語の文章を英語の文章に翻訳します。その際、翻訳文章の先頭の英単語の頭文字は小文字にします。ただし、もともと頭文字が大文字である英単語は、文章の先頭であっても小文字にしません。'
    },
    {
      role: 'user',
      content: '次の文章を翻訳してください。```これは日本語の文章です。```'
    },
    {
      role: 'assistant',
      content: 'This is a Japanese sentence.'
    },
    {
      role: 'user',
      content: '翻訳文章の先頭の英単語の頭文字は小文字でなければなりません。'
    },
    {
      role: 'assistant',
      content: 'this is a Japanese sentence.'
    },
    {
      role: 'user',
      content: '次の文章を翻訳してください。```私は日本人です。```'
    },
    {
      role: 'assistant',
      content: 'i am Japanese.'
    },
    {
      role: 'user',
      content: 'もともと頭文字が大文字である英単語は、文章の先頭であっても小文字にしないでください。'
    },
    {
      role: 'assistant',
      content: 'I am Japanese'
    },
    {
      role: 'user',
      content: '次の文章を翻訳してください。```' + japanese.value + '```'
    }
  ];

  // Requestオブジェクトを作成。
  const myRequest = new Request('https://ojk-english.deno.dev', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages,
      max_tokens: 50 //レスポンスのトークンの最大数
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  // fetch APIを使用してリクエストを送信
  const res = await fetch(myRequest);
  const json = await res.json();
  // レスポンスをJSONとしてパース

  // JSONレスポンスからメッセージを取得してコンソールに出力
  console.log(JSON.stringify(json, null, 2));
  console.log('Answer:' + json.choices[0].message.content);
  correctSentence = json.choices[0].message.content;

  // 単語を空白ごとに分ける
  const original = json.choices[0].message.content.split(' ');

  // 先頭の単語の大文字を小文字に変更
  //original[0] = original[0].toLowerCase();

  // ,と.を単語から分ける
  const words = [];
  for (let word of original) {
    // console.log(word);
    if (word.includes(',')) {
      words.push(word.slice(0, word.length - 1));
      words.push(',');
    } else if (word.includes('.')) {
      words.push(word.slice(0, word.length - 1));
      words.push('.');
    } else {
      words.push(word);
    }
  }

  // キャピタライズ
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    if (capitalWords.includes(word)) {
      words[i] = word.charAt(0).toUpperCase() + word.slice(1);
      console.log(`${word} > ${words[i]}`);
    }
  }

  // 正解の英語文章の配列を記録
  correctWords = [...words];
};

/** ChatGPT： 似通った日本語文章を生成 */
const generateSentence = async () => {
  // チャットの初期メッセージを定義
  const messages = [
    {
      role: 'system', //役割
      content:
        'あなたは問題の作成者です。与えられた日本語の文章を元にして、単語や表現の異なる新しい日本語の文章を作成してください。'
    },
    {
      role: 'user', // ユーザーからのメッセージ
      content: japanese.value // 入力された日本語
    }
  ];
  // １．あなたは問題の作成者です。与えられた日本語の文章を元にして、単語や表現の異なる新しい日本語の文章を作成してください。
  // ２．あなたは問題の作成者です。与えられた日本語の文章を参考にして、新しい日本語の文章を作成してください。
  // ３．あなたは問題の作成者です。与えられた日本語の文章を参考にして、単語や表現の異なる新しい日本語の文章を作成してください。
  // ４．あなたは問題の作成者です。与えられた日本語の文章を元にして、使用する単語や表現を変えた新しい日本語の文章を作成してください。
  // ５．あなたは問題の作成者です。与えられた日本語の文章を参考にして、新しい自然な日本語の文章を作成してください。
  // ６．あなたは問題の作成者です。与えられた日本語の文章から、新しい日本語の文章を作成してください。
  // ７．あなたは問題の作成者です。与えられた日本語の文章を元にして、使用する単語や表現を変えた、新しい自然な日本語の文章を作成してください。
  // ８．あなたは問題の作成者です。与えられた日本語の文章から、使用する単語や表現を変えた新しい日本語の文章を作成してください。
  // ９．あなたは問題の作成者です。与えられた日本語の文章を参考にして、使用する単語や表現を変えた新しい日本語の文章を作成してください。

  // Requestオブジェクトを作成。
  const myRequest = new Request('https://ojk-english.deno.dev', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages,
      max_tokens: 100 //レスポンスのトークンの最大数
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  // fetch APIを使用してリクエストを送信
  const res = await fetch(myRequest);
  const json = await res.json();

  // JSONレスポンスからメッセージを取得してコンソールに出力
  // console.log(json.choices[0].message.content);
  console.log(JSON.stringify(json), null, 2);

  // フォームに入力（あとで候補を取得するように変更したい…けど1回のアクセスでは難しい？）
  japanese.value = json.choices[0].message.content;
};

/** ChatGPT： ヒントを出してもらう */
const hint = async () => {
  // チャットの初期メッセージを定義
  const messages = [
    {
      role: 'system',
      content:
        'あなたはヒントの作成者です。与えられた英語の文章の英単語がランダムに表示されていて、その英単語を正しい順序に並び替える整序問題として解く場合に必要な英文法のヒントを作成します。その際、与えられた英語の文章の具体的な英単語の順序や答えとなる英文をそのまま示さないでください。'
      // 英文法は「命令文、現在進行形、過去進行形、完了形、受動態、不定詞、現在分詞、過去分詞、比較、間接疑問文、関係代名詞、関係副詞、仮定法」などがあります。
    },
    {
      role: 'user',
      content:
        '次の英単語がランダムに表示されていて、その英単語を正しい順序に並び替える整序問題として解くための英文法や構文のヒントを作成してください。```[I, talked, to, him, sitting, on, the, chair, to, ask, his, name, .]```'
    },
    {
      role: 'assistant',
      content:
        '「talk to」で「話しかける」という意味になります。この文章では、「sitting on the chair」のような現在分詞や不定詞「～するために」の文法が使われています。並び替えると「I talked to him sitting on the chair to ask his name.」という文章になります。'
    },
    {
      role: 'user',
      content: '与えられた英語の文章の具体的な英単語の順序や答えとなる英文をそのまま示さないでください。'
    },
    {
      role: 'assistant',
      content:
        '「talk to」で「話しかける」という意味になります。この文章では、現在分詞や不定詞「～するために」の文法が使われています。'
    },
    {
      role: 'user',
      content:
        '次の英単語がランダムに表示されていて、その英単語を正しい順序に並び替える整序問題として解くための英文法や構文のヒントを作成してください。```' +
        correctWords +
        '```'
    }
  ];

  // Requestオブジェクトを作成。
  const myRequest = new Request('https://ojk-english.deno.dev', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages,
      max_tokens: 200 //レスポンスのトークンの最大数
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  // fetch APIを使用してリクエストを送信
  const res = await fetch(myRequest);
  const json = await res.json();

  // JSONレスポンスからメッセージを取得してコンソールに出力
  console.log(JSON.stringify(json), null, 2);
  console.log(correctSentence);
  console.log(json.choices[0].message.content);

  hintSentence = json.choices[0].message.content;
  const p = document.createElement('p');
  p.id = 'content';
  p.textContent = hintSentence;
  hintDisplay.appendChild(p);
};

/** ChatGPT： ○の場合の解説 */
const correctHint = async () => {
  // チャットの初期メッセージを定義
  const messages = [
    // {
    //   role: 'system',
    //   content:
    //     'あなたは英文の解説者です。与えられた間違いの英語の文章と正解の英語の文章を比較した際に、どこが間違っているのかを、文法的に解説してください。'
    // },
    // {
    //   role: 'user',
    //   content:
    //     '次の間違いの英語の文章と正解の英語の文章を比較した際に、どこが間違っているのかを、文法的に解説してください。間違いの文章は```' + userSentence + '```、正解の文章は```' + correctSentence + '```'
    // }
    {
      role: 'system',
      content: 'あなたは英文の解説者です。与えられた英語の文章の文法を解説してください。'
    },
    {
      role: 'user',
      content: '与えられた英語の文章の文法を解説してください。```' + correctSentence + '```'
    }
  ];

  // リクエストオプション
  const myRequest = new Request('https://ojk-english.deno.dev', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages,
      max_tokens: 200 //レスポンスのトークンの最大数
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  // fetch APIを使用してリクエストを送信
  const res = await fetch(myRequest);
  const json = await res.json();

  // JSONレスポンスからメッセージを取得してコンソールに出力
  console.log(JSON.stringify(json), null, 2);
  console.log(json.choices[0].message.content);

  correctHintSentence = json.choices[0].message.content;
  const p = document.createElement('p');
  p.id = 'content';
  p.textContent = correctHintSentence;
  explainDisplay.appendChild(p);
};

/** ChatGPT： ×の場合の解説 */
const falseHint = async () => {
  // チャットの初期メッセージを定義
  const messages = [
    {
      role: 'system',
      content:
        'あなたは英文の解説者です。与えられた間違いの英語の文章と正解の英語の文章を比較した際に、どこが間違っているのかを、文法的に解説してください。'
    },
    {
      role: 'user',
      content:
        '次の間違いの英語の文章と正解の英語の文章を比較した際に、どこが間違っているのかを、文法的に解説してください。間違いの文章は```' +
        userSentence +
        '```、正解の文章は```' +
        correctSentence +
        '```'
    }
    // {
    //   role: 'system',
    //   content:
    //     'あなたは英文の解説者です。与えられた英語の文章の文法を解説してください。'
    // },
    // {
    //   role: 'user',
    //   content:
    //     '与えられた英語の文章の文法を解説してください。```' + correctSentence + '```'
    // }
  ];

  // Requestオブジェクトを作成。
  const myRequest = new Request('https://ojk-english.deno.dev', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages,
      max_tokens: 200 //レスポンスのトークンの最大数
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  // fetch APIを使用してリクエストを送信
  const res = await fetch(myRequest);
  const json = await res.json();

  // JSONレスポンスからメッセージを取得してコンソールに出力
  console.log(JSON.stringify(json), null, 2);
  console.log(correctSentence);
  console.log(json.choices[0].message.content);
  console.log(userSentence);

  falseHintSentence = json.choices[0].message.content;
  const p = document.createElement('p');
  p.id = 'content';
  p.textContent = falseHintSentence;
  explainDisplay.appendChild(p);
};

/** ChatGPT： 正誤判断 */
const judgegpt = async () => {
  // チャットの初期メッセージを定義
  const messages = [
    {
      role: 'system',
      content:
        // 'あなたは問題の正誤判断をします。与えられた日本語の文章を、与えられた英単語の配列の整序問題として英語に訳す際に、与えられた英語の文章が訳として合っている場合は「true」、合っていない場合は「false」と返答してください。また、falseの場合は、その理由も示してください。また、文末のピリオドは基本的に最後についているものとします。'
        // 'あなたは問題の正誤判断をします。与えられた英単語の配列を正しい順番に並び替える際に、与えられた英語の文章が文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答して下さい。また、falseの場合は、その理由も示してください。また、文末のピリオドは基本的に最後についているものとします。'
        // 'あなたは問題の正誤判断をします。与えられた英語の文章が、文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答してください。また、falseの場合は、その理由も示してください。また、文末のピリオドは基本的に最後についているものとします。'
        'あなたは問題の正誤判断をします。与えられた日本語の文章を英語に訳す際に、与えられた英語の文章が文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答してください。また、falseの場合は、なぜ正しくないのか理由も示してください。文章の種類やニュアンスによっては、副詞が文章の最後に来てもtrueとしてください。'
    },
    {
      role: 'user',
      content:
        // '与えられた日本語の文章を、与えられた英単語の配列の整序問題として英語に訳す際に、与えられた英語の文章が訳として合っている場合は「true」、合っていない場合は「false」と返答してください。日本語の文章は```私は冬が好きです。```、英単語の配列は```["winter", "I", "like", ". "]```、英語の文章は```I like winter.```'
        // '与えられた英単語の配列を正しい順番に並び替える際に、与えられた英語の文章が文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答して下さい。英単語の配列は```["winter", "I", "like", "."]```、英語の文章は```I like winter.```'
        // '与えられた英語の文章が、文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答してください。```I like winter.```'
        '与えられた日本語の文章を英語に訳す際に、与えられた英語の文章が文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答してください。日本語の文章は```私は検索するときには主にGoogleを利用しています。```、英語の文章は```I use google mainly when searching.```'
    },
    {
      role: 'assistant',
      content: 'false'
    },
    {
      role: 'user',
      content: '文章の種類やニュアンスによっては、副詞が文章や節の最後に来てもtrueとしてください。'
    },
    {
      role: 'assistant',
      content: 'true'
    },
    {
      role: 'user',
      content:
        // '与えられた日本語の文章を、与えられた英単語の配列の整序問題として英語に訳す際に、与えられた英語の文章が訳として合っている場合は「true」、合っていない場合は「false」と返答してください。日本語の文章は```' + japanese.value + '```、英単語の配列は```' + shuffledWords + '```、英語の文章は```' + userSentence + '```'
        // '与えられた英単語の配列を正しい順番に並び替える際に、与えられた英語の文章が文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答して下さい。英単語の配列は```' + shuffledWords + '```、英語の文章は```' + userSentence + '```'
        // '与えられた英語の文章が、文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答してください。```' + userSentence + '```'
        '与えられた日本語の文章を英語に訳す際に、与えられた英語の文章が文法的に正しいかどうかを判断してください。正しい場合は「true」、間違っている場合は「false」と返答してください。日本語の文章は```' +
        japanese.value +
        '```、英語の文章は```' +
        userSentence +
        '```'
    }
  ];

  // Requestオブジェクトを作成。
  const myRequest = new Request('https://ojk-english.deno.dev', {
    method: 'POST',
    body: JSON.stringify({
      messages: messages,
      max_tokens: 100 //レスポンスのトークンの最大数
    }),
    headers: { 'Content-Type': 'application/json' }
  });

  // fetch APIを使用してリクエストを送信
  const res = await fetch(myRequest);
  const json = await res.json();

  // JSONレスポンスからメッセージを取得してコンソールに出力
  console.log(JSON.stringify(json), null, 2);
  console.log(correctSentence);
  console.log(json.choices[0].message.content);
  console.log(shuffledWords);
  console.log(userSentence);
};
