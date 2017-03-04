(function() {
  // constants
  const IMG_PATH = './public/img/couriers';

  const QUESTION_AND_ANSWERS = [{
    question: {
      name: 'Hong Kong Post',
      answer: 'hong-kong-post'
    },
    choices: [
      'india-post',
      'china-post',
      'hong-kong-post',
      'canada-post'
    ]
  }, {
    question: {
      name: 'TAQBIN',
      answer: 'taqbin-hk'
    },
    choices: [
      'austrian-post-registered',
      'deutsch-post',
      'spain-correos-es',
      'taqbin-hk'
    ]
  }, {
    question: {
      name: 'Nightline',
      answer: 'nightline'
    },
    choices: [
      'nightline',
      'expeditors',
      'collectplus',
      'omniparcel'
    ]
  }, {
    question: {
      name: 'Sendle',
      answer: 'sendle'
    },
    choices: [
      'oca-ar',
      'jersey-post',
      'mailamericas',
      'sendle'
    ]
  }, {
    question: {
      name: 'Siodemka',
      answer: 'siodemka'
    },
    choices: [
      'siodemka',
      'poczta-polska',
      'posten-norge',
      'bpost'
    ]
  }];

  const SECONDS_OF_ONE_ROUND = 10;

  // selectors
  const startBtn = document.querySelector('#start-button');
  const nextBtn = document.querySelectorAll('.next-button');

  const pageNodes = {
    landing: document.querySelector('#landing-page'),
    game: document.querySelector('#game-page'),
    timeout: document.querySelector('#timeout-page'),
    correct: document.querySelector('#correct-page'),
    incorrect: document.querySelector('#incorrect-page'),
    result: document.querySelector('#game-result-page')
  };

  const timeTextNode = document.querySelector('#timeText');
  const pointTextNode = document.querySelector('#pointText');

  const roundTextNode = document.querySelector('#roundText');
  const questionNode = document.querySelector('section#question .title');
  const answerImgNodes = document.querySelectorAll('section#answer img');
  const resultTextNode = document.querySelector('#resultText');

  // utils
  const transitPage = nextPage => {
    Object.values(pageNodes).forEach(page => {
      page === nextPage
        ? page.classList.remove('is-hidden')
        : page.classList.add('is-hidden')
    });
  };

  const loadQuestionAndAnwsers = round => {
    roundTextNode.innerHTML = round;
    const questionAndAnswers = QUESTION_AND_ANSWERS[round - 1];
    const {question, choices} = questionAndAnswers;
    questionNode.innerHTML = question.name;
    answerImgNodes.forEach((n, i) => {
      const slug = choices[i];
      n.src = `${IMG_PATH}/${slug}.svg`;
      n.dataset.slug = slug;
    });
  };

  const loadResult = point => {
    resultTextNode.innerHTML = point;
  }

  const getCorrectAnswer = round => QUESTION_AND_ANSWERS[round - 1].question.answer;

  // countdown
  const tick$ = Rx.Observable.timer(0, 1000);
  const countdown$ = tick$
    .takeWhile(tick => tick <= SECONDS_OF_ONE_ROUND)
    .map(tick => SECONDS_OF_ONE_ROUND - tick)
    .do(time => {
      timeTextNode.innerHTML = time;
    });

  // answer
  const timeout$ = countdown$
    .filter(time => time === 0)
    .map(() => null);

  const selectAnswer$ = Rx.Observable.fromEvent(answerImgNodes, 'click')
    .map(event => event.target.dataset.slug);

  const answer$ = Rx.Observable.merge(selectAnswer$, timeout$)
    .first();

  const roundResult$ = round => answer$
    .map(answer => {
      if (answer) {
        return answer === getCorrectAnswer(round) ? 'correct' : 'incorrect';
      } else {
        return 'timeout';
      }
    })
    .do(roundResult => {
      transitPage(pageNodes[roundResult]);
    })

  // game
  const ROUNDS_NUM = QUESTION_AND_ANSWERS.length;

  const gameStartBtn$ = Rx.Observable.fromEvent(startBtn, 'click');
  const nextRoundBtn$ = Rx.Observable.fromEvent(nextBtn, 'click').share();

  const roundStarter$ = Rx.Observable.merge(gameStartBtn$, nextRoundBtn$)
    .take(ROUNDS_NUM)
    .scan(acc => acc + 1, 0);

  const round$ = roundStarter$
    .do(round => {
      transitPage(pageNodes.game);
      loadQuestionAndAnwsers(round);
    })
    .switchMap(roundResult$)
    .map(roundResult => roundResult === 'correct');

  const gameEnd$ = nextRoundBtn$
    .skip(ROUNDS_NUM);

  const game$ = round$
    .scan((acc, isCorrect) => acc + (isCorrect ? 1 : 0), 0)
    .combineLatest(gameEnd$)
    .map(d => d[0])
    .subscribe(totalPoint => {
      transitPage(pageNodes.result);
      loadResult(totalPoint);
    });
})();
