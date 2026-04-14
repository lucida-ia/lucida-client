# Logotipo e Elementos Gráficos — Lucida

## Variações de logotipo disponíveis

Cada produto tem três versões do logotipo:

- **Símbolo**: só o ícone "Lulu" — para avatares, favicons, espaços pequenos
- **Logotipo completo**: símbolo + nome — uso principal
- **Logo tipográfico**: só o texto — uso secundário
- **Tag**: versão com tagline do produto — contextos específicos

| Produto       | Tag / subtítulo associado |
| ------------- | ------------------------- |
| Lucida / Exam | —                         |

---

## Tamanhos mínimos

| Elemento          | Digital (px) | Impresso (mm) |
| ----------------- | ------------ | ------------- |
| Logotipo completo | 160px        | 30mm          |
| Logo tipográfico  | 140px        | 25mm          |
| Símbolo isolado   | 40px         | 10mm          |

Abaixo desses tamanhos, a legibilidade é comprometida. **Não usar.**

---

## Área de proteção (zona de exclusão)

Espaço mínimo obrigatório ao redor do logotipo = largura da letra **"c"** do logotipo.

Nenhum texto, ícone, imagem ou elemento gráfico pode invadir essa zona.
Essa regra vale para **todas as versões** de todos os logotipos.

Em CSS, se usar logotipo como imagem:

```css
.logo-wrapper {
  /* padding proporcional ao tamanho do logo */
  padding: calc(var(--logo-width) * 0.08);
}
```

---

## Posicionamento permitido

O logotipo só pode ser posicionado em 5 locais:

1. Canto superior esquerdo
2. Canto superior direito
3. Centralizado
4. Canto inferior esquerdo
5. Canto inferior direito

Lembrar de aplicar a zona de exclusão ao posicionar nos cantos.

---

## Cores do logotipo

| Situação                                  | Versão a usar         |
| ----------------------------------------- | --------------------- |
| Fundo claro com bom contraste             | Colorida (azul+preto) |
| Fundo escuro                              | Branca                |
| Fundo colorido / sem contraste suficiente | Preta ou branca       |
| Impressão sem cor                         | Preta                 |

---

## Uso incorreto — NUNCA fazer

- ❌ Rotacionar o logotipo em qualquer ângulo
- ❌ Alterar as proporções (esticar/comprimir)
- ❌ Adicionar outline/stroke ao logotipo
- ❌ Mudar as cores fora do padrão definido
- ❌ Adicionar elementos novos ao logotipo
- ❌ Redesenhar ou modificar qualquer parte
- ❌ Colocar o logotipo em posição que não seja uma das 5 permitidas

---

## Elementos gráficos da marca (personagem "Lulu")

O símbolo pode ser usado de forma dinâmica com "braços e ferramentas" em diferentes
posições para dar personalidade e contexto nas comunicações.

**Regras para novas variações:**

- Apenas traços (stroke), sem preenchimento (fill)
- Cor: apenas preto
- Pontas: arredondadas (stroke-linecap: round; stroke-linejoin: round)
- Manter a proporção e reconhecibilidade do símbolo base

```css
/* SVG do personagem — estilo correto */
.lulu-graphic path,
.lulu-graphic circle {
  stroke: #000000;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```
