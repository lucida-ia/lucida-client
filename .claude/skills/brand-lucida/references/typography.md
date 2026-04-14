# Tipografia — Lucida

## Fontes da marca

| Função       | Fonte            | Import                                              |
|--------------|------------------|-----------------------------------------------------|
| Principal    | Poppins          | Google Fonts: `family=Poppins:wght@300;400;500;700` |
| Destaque     | Instrument Serif | Google Fonts: `family=Instrument+Serif:ital@1`      |

**Regra:** Instrument Serif é usada APENAS em itálico e APENAS para palavras de
destaque dentro de títulos. Nunca como fonte de corpo de texto.

---

## Hierarquia tipográfica

### Título (H1)
- Fonte: Poppins Regular (400)
- Tamanho referência: 70pt / ~93px digital
- Entrelinha: 1x o tamanho (line-height: 1)
- Destaque dentro do título: Instrument Serif Italic, peso 75 (bold-italic)

```css
h1 {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: clamp(2.5rem, 5vw, 5.8rem);
  line-height: 1;
  letter-spacing: 0;
}
h1 em {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-weight: 700;
}
```

### Subtítulo (H2)
- Fonte: Poppins Regular (400)
- Tamanho referência: 40pt / ~53px digital
- Entrelinha: 1x o tamanho

```css
h2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: clamp(1.8rem, 3vw, 3.3rem);
  line-height: 1;
}
```

### Corpo de texto (p)
- Fonte: Poppins Regular (400)
- Tamanho referência: 20pt / ~27px digital
- Entrelinha: 1x o tamanho

```css
p {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: clamp(1rem, 1.5vw, 1.7rem);
  line-height: 1;
}
```

### Texto de detalhe / caption
- Fonte: Poppins Light (300)
- Tamanho referência: 18pt / ~24px digital
- Entrelinha: ligeiramente maior (line-height: 1.1)

```css
.text-detail, caption, small {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: clamp(0.9rem, 1.2vw, 1.5rem);
  line-height: 1.1;
}
```

---

## Tailwind — classes customizadas sugeridas

Adicionar no `tailwind.config.js`:

```js
theme: {
  extend: {
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
      serif: ['Instrument Serif', 'serif'],
    },
  }
}
```

Uso nas classes:
```html
<!-- Título com destaque -->
<h1 class="font-sans font-normal text-6xl leading-none">
  Crie provas com IA <em class="font-serif italic font-bold">em segundos</em>
</h1>

<!-- Corpo -->
<p class="font-sans font-normal text-xl leading-tight">...</p>

<!-- Detalhe -->
<span class="font-sans font-light text-lg">...</span>
```

---

## Erros comuns — NUNCA fazer

| ❌ Errado                          | ✅ Correto                               |
|------------------------------------|------------------------------------------|
| Usar outra fonte qualquer          | Apenas Poppins + Instrument Serif        |
| Instrument Serif em texto corrido  | Instrument Serif só em palavras de título |
| Texto justificado (text-justify)   | Alinhado à esquerda ou centralizado      |
| Outline/stroke no texto            | Texto sólido sem outline                 |
| Esticar/distorcer o texto          | Proporções originais sempre              |
| Letter-spacing muito negativo      | Valor 0 ou positivo sutil                |
| Line-height muito baixo            | Mínimo 1x o tamanho da fonte             |
