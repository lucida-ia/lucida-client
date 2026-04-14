# Paletas de Cores — Lucida

## Lucida e Lucida Exam (tom azul)

| Nome           | HEX       | CMYK            | Pantone |
| -------------- | --------- | --------------- | ------- |
| Azul Principal | `#007AFF` | 72 / 47 / 0 / 0 | 285 C   |
| Azul Escuro 01 | `#1D14FF` | 84 / 75 / 0 / 0 | 2728 C  |
| Azul Escuro 02 | `#150BBC` | 91 / 86 / 0 / 0 | 2738 C  |
| Azul Claro     | `#7FBDF4` | 38 / 13 / 0 / 0 | 2905 C  |

**Uso em CSS/Tailwind:**

```css
/* Tokens recomendados */
--lucida-blue-primary: #007aff;
--lucida-blue-dark1: #1d14ff;
--lucida-blue-dark2: #150bbc;
--lucida-blue-light: #7fbdf4;
```

---

## Cores Secundárias (todas as marcas)

Usadas como apoio e contraste em todos os produtos:

| Nome              | HEX       | CMYK              | Pantone |
| ----------------- | --------- | ----------------- | ------- |
| Azul Super Escuro | `#051E2C` | 93 / 76 / 53 / 62 | 2965 C  |
| Off White         | `#F9F5EA` | 1 / 2 / 6 / 0     | 7527 C  |
| Preto             | `#000000` | —                 | —       |
| Branco            | `#FFFFFF` | —                 | —       |

**Quando usar secundárias:**

- `#051E2C` (Azul Super Escuro): fundos escuros, contraste forte — é o "navy" da marca
- `#F9F5EA` (Off White): fundos claros alternativos ao branco puro
- Preto/Branco: logotipos monocromáticos, textos, ícones

---

## Regras de combinação

- Fundo escuro (`#051E2C`) → texto branco + cor principal do produto
- Fundo branco/off-white → cor principal do produto + texto preto
- **Nunca** misturar paletas de produtos diferentes no mesmo layout
- Se a cor não oferecer contraste suficiente, usar versão preto ou branco do logotipo
