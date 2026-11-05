# FutPontos Flutter

Aplicativo Android desenvolvido em paralelo ao PWA existente. O PWA continua sendo a interface web e a API atual permanece como fonte dos dados.

## Estado desta etapa

- Tela inicial de acesso (UI).
- Exploração pública em modo somente leitura.
- Início com verificação de disponibilidade da API.
- Classificação e lista de jogadores consumindo `GET /jogadores`.
- Desempenho consumindo `GET /desempenho`.
- Navegação inferior e estados de carregamento, erro, vazio e atualização manual.

## Limitação de autenticação

A API atualmente consultada não apresenta contrato de login/autenticação. Por segurança, esta versão não envia credenciais, não simula sessão e não armazena senhas. O botão Entrar informa essa limitação. A ativação do login real depende de autenticação no servidor, autorização por perfil e definição do fluxo de recuperação de conta.

## Áreas que aguardam confirmação dos contratos

Goleiros, montagem de times e detalhes de competências não foram ligados a endpoints presumidos. Serão integrados após validar as rotas e seus formatos na API atual.

## Executar

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

Não há banco de dados adicional. O aplicativo consome `https://api.semdominio.online`.
