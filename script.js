"use strict"; 
//Desenho dos símbolos X e O como SVG 
const SIMBOLO_X = '<svg class="simbolo" viewBox="0 0 100 100" aria-hidden="true">' + '<path d="M14 14L86 86M86 14L14 86" fill="none" stroke="currentColor" ' + 'stroke-width="9" stroke-linecap="round"/></svg>';
const SIMBOLO_O = '<svg class="simbolo" viewBox="0 0 100 100" aria-hidden="true">' + '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" ' + 'stroke-width="9"/></svg>';

const SIMBOLOS = [SIMBOLO_X, SIMBOLO_O]; // índice 0 = Jogador 1, índice 1 = Jogador 2
const LETRAS = ["X", "O"];

// 8 combinações vencedoras
const COMBINACOES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], 
  [0, 3, 6], [1, 4, 7], [2, 5, 8], 
  [0, 4, 8], [2, 4, 6]             
];

// Coordenadas da linha que risca
const LINHAS_VENCEDORAS = [
  [0, 50, 300, 50], [0, 150, 300, 150], [0, 250, 300, 250],
  [50, 0, 50, 300], [150, 0, 150, 300], [250, 0, 250, 300],
  [0, 0, 300, 300], [300, 0, 0, 300]
];

const ATRASO_MODAL = 900; // atraso para o jogador ver a linha antes do modal

let jogo = {
  nomes: ["", ""],
  placar: [0, 0],
  tabuleiro: [null, null, null, null, null, null, null, null, null],
  vezDe: 0,           //0 = Jogador 1, 1 = Jogador 2
  inicioDaRodada: 0,  // quem começou a rodada atual
  jogadas: 0,
  emAndamento: false
};

let temporizador = null; // controla atraso até o modal aparecer

/* Elementos do documento (getElementById — Unidade 09) */
const telaInicial = document.getElementById("telaInicial");
const telaJogo = document.getElementById("telaJogo");

const quadrados = [];
for (let i = 0; i < 9; i++) {
  quadrados[i] = document.getElementById("q" + i);
}

const infoJogador = [
  document.getElementById("jogador1Info"),
  document.getElementById("jogador2Info")
];
const elementoNome = [
  document.getElementById("nomeJogador1"),
  document.getElementById("nomeJogador2")
];
const elementoPlacar = [
  document.getElementById("placar1"),
  document.getElementById("placar2")
];

const linhaVencedora = document.getElementById("linhaVencedora");
const linhaRisco = document.getElementById("linhaRisco");
const modal = document.getElementById("modal");
const btnFecharModal = document.getElementById("btnFecharModal");

// validação de dados de formulário 
function validarFormulario() {
  const nome1 = document.forms["formJogadores"]["jogador1"].value.trim();
  const nome2 = document.forms["formJogadores"]["jogador2"].value.trim();

  if (nome1 == null || nome1 === "") {
    alert("O nome do Jogador 1 deve ser preenchido!");
    document.getElementById("jogador1").focus();
    return false;
  }

  if (nome2 == null || nome2 === "") {
    alert("O nome do Jogador 2 deve ser preenchido!");
    document.getElementById("jogador2").focus();
    return false;
  }

  if (nome1.toLowerCase() === nome2.toLowerCase()) {
    alert("Os jogadores devem ter nomes diferentes!");
    document.getElementById("jogador2").focus();
    return false;
  }

  return true;
}

// Event listener no formulário
document.getElementById("formJogadores").addEventListener("submit", function (evento) {
  evento.preventDefault(); // não há servidor: a partida acontece nesta própria página
  if (validarFormulario()) {
    iniciarPartida();
  }
});

function iniciarPartida() {
  jogo.nomes[0] = document.forms["formJogadores"]["jogador1"].value.trim();
  jogo.nomes[1] = document.forms["formJogadores"]["jogador2"].value.trim();

  elementoNome[0].textContent = jogo.nomes[0];
  elementoNome[1].textContent = jogo.nomes[1];

  zerarPartida();

  telaInicial.classList.add("oculto");
  telaJogo.classList.remove("oculto");
}

//Zera placar e começa uma nova rodada
function zerarPartida() {
  jogo.placar[0] = 0;
  jogo.placar[1] = 0;
  jogo.inicioDaRodada = 0;
  novaRodada();
}

// Limpa o tabuleiro para uma nova rodada
function novaRodada() {
  clearTimeout(temporizador);
  modal.classList.add("oculto");
  linhaVencedora.classList.add("oculto");

  for (let i = 0; i < 9; i++) {
    jogo.tabuleiro[i] = null;
    quadrados[i].innerHTML = "";
    quadrados[i].disabled = false;
    quadrados[i].setAttribute("aria-label", rotuloDaCasa(i));
  }

  jogo.vezDe = jogo.inicioDaRodada;
  jogo.jogadas = 0;
  jogo.emAndamento = true;

  atualizarPlacar();
  atualizarVez();
}

function rotuloDaCasa(i) {
  const linha = Math.floor(i / 3) + 1;
  const coluna = (i % 3) + 1;
  return "Linha " + linha + ", coluna " + coluna;
}

function atualizarPlacar() {
  elementoPlacar[0].innerHTML = jogo.placar[0];
  elementoPlacar[1].innerHTML = jogo.placar[1];
}

// Destaca o jogador da vez 
function atualizarVez() {
  for (let p = 0; p < 2; p++) {
    if (p === jogo.vezDe) {
      infoJogador[p].classList.add("ativo");
    } else {
      infoJogador[p].classList.remove("ativo");
    }
  }
  document.getElementById("status").textContent =
    "Vez de " + jogo.nomes[jogo.vezDe] + " (" + LETRAS[jogo.vezDe] + ").";
}

function jogar(i) {
  if (!jogo.emAndamento || jogo.tabuleiro[i] !== null) {
    return;
  }

  jogo.tabuleiro[i] = jogo.vezDe;
  jogo.jogadas++;
  quadrados[i].innerHTML = SIMBOLOS[jogo.vezDe];
  quadrados[i].disabled = true;
  quadrados[i].setAttribute("aria-label", rotuloDaCasa(i) + ": " + LETRAS[jogo.vezDe]);

  const combinacao = encontrarVitoria();

  if (combinacao !== -1) {
    finalizarComVitoria(combinacao);
  } else if (jogo.jogadas === 9) {
    finalizarComEmpate();
  } else {
    jogo.vezDe = 1 - jogo.vezDe; 
    atualizarVez();
  }
}

// Retorna o índice da combinação vencedora ou -1 se ninguém venceu
function encontrarVitoria() {
  for (let c = 0; c < COMBINACOES.length; c++) {
    const a = COMBINACOES[c][0];
    const b = COMBINACOES[c][1];
    const d = COMBINACOES[c][2];

    if (jogo.tabuleiro[a] !== null &&
        jogo.tabuleiro[a] === jogo.tabuleiro[b] &&
        jogo.tabuleiro[a] === jogo.tabuleiro[d]) {
      return c;
    }
  }
  return -1;
}

function desabilitarTabuleiro() {
  for (let i = 0; i < 9; i++) {
    quadrados[i].disabled = true;
  }
}

function finalizarComVitoria(combinacao) {
  const vencedor = jogo.vezDe;

  jogo.emAndamento = false;
  jogo.placar[vencedor]++;
  jogo.inicioDaRodada = vencedor; //quem venceu começa a próxima rodada

  atualizarPlacar();
  desabilitarTabuleiro();
  desenharLinha(combinacao);

  temporizador = setTimeout(function () {
    abrirModalVitoria(vencedor);
  }, ATRASO_MODAL);
}

function finalizarComEmpate() {
  jogo.emAndamento = false;

  jogo.inicioDaRodada = 1 - jogo.inicioDaRodada;

  desabilitarTabuleiro();

  temporizador = setTimeout(function () {
    abrirModalEmpate();
  }, ATRASO_MODAL / 2);
}

function desenharLinha(combinacao) {
  linhaRisco.setAttribute("x1", LINHAS_VENCEDORAS[combinacao][0]);
  linhaRisco.setAttribute("y1", LINHAS_VENCEDORAS[combinacao][1]);
  linhaRisco.setAttribute("x2", LINHAS_VENCEDORAS[combinacao][2]);
  linhaRisco.setAttribute("y2", LINHAS_VENCEDORAS[combinacao][3]);
  linhaVencedora.classList.remove("oculto");
}

// mensagens de vitória e empate

function abrirModalVitoria(vencedor) {
  document.getElementById("modalSimbolos").innerHTML = SIMBOLOS[vencedor];
  document.getElementById("modalTitulo").textContent = "PARABÉNS!";
  document.getElementById("modalNome").textContent = jogo.nomes[vencedor];
  document.getElementById("modalNome").classList.remove("oculto");
  document.getElementById("modalMensagem").textContent =
    "Você ganhou e começa jogando a próxima rodada!";
  mostrarModal();
}

function abrirModalEmpate() {
  document.getElementById("modalSimbolos").innerHTML = SIMBOLO_X + SIMBOLO_O;
  document.getElementById("modalTitulo").textContent = "EMPATE!";
  document.getElementById("modalNome").classList.add("oculto");
  document.getElementById("modalMensagem").textContent =
    "Desta vez, começa jogando quem foi o segundo a jogar na rodada passada";
  mostrarModal();
}

function mostrarModal() {
  modal.classList.remove("oculto");
  btnFecharModal.focus();
}

btnFecharModal.addEventListener("click", function () {
  novaRodada();
});

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && !modal.classList.contains("oculto")) {
    novaRodada();
  }
});

for (let i = 0; i < 9; i++) {
  quadrados[i].addEventListener("click", function () {
    jogar(i);
  });
}

function haProgresso() {
  return jogo.jogadas > 0 || jogo.placar[0] > 0 || jogo.placar[1] > 0;
}

// Seta voltar
document.getElementById("btnVoltar").addEventListener("click", function () {
  if (haProgresso() && !confirm("Deseja voltar para a tela inicial? A partida atual será encerrada.")) {
    return;
  }

  clearTimeout(temporizador);
  jogo.emAndamento = false;
  modal.classList.add("oculto");
  telaJogo.classList.add("oculto");
  telaInicial.classList.remove("oculto");
  document.getElementById("jogador1").focus();
});

// Botão de reiniciar
document.getElementById("btnReiniciar").addEventListener("click", function () {
  if (haProgresso() && !confirm("Deseja reiniciar a partida? O placar será zerado.")) {
    return;
  }
  zerarPartida();
});
