import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:futpontos/main.dart';

void main() {
  testWidgets('exibe a tela inicial de acesso do FutPontos', (tester) async {
    await tester.pumpWidget(const FutPontosApp());

    expect(find.text('FUTPONTOS'), findsOneWidget);
    expect(find.text('Seu futebol. Seus números.'), findsOneWidget);
    expect(find.text('Entrar'), findsOneWidget);
    expect(find.text('Explorar versão pública'), findsOneWidget);
  });

  testWidgets('login informa que autenticação ainda não está disponível',
      (tester) async {
    await tester.pumpWidget(const FutPontosApp());

    await tester.tap(find.text('Entrar'));
    await tester.pump();

    expect(
      find.textContaining('O login seguro depende de uma rota de autenticação'),
      findsOneWidget,
    );
  });
  testWidgets('perfil detalha estatísticas e composição dos pontos', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: PlayerProfilePage(
          position: 1,
          player: {
            'id': 7,
            'nome': 'Jogador de teste',
            'pontos': 15,
            'vitorias': 2,
            'gols': 3,
            'empate': 1,
            'defesa': 4,
            'infracoes': 1,
            'competencia': '2026-11',
          },
        ),
      ),
    );

    expect(find.text('Jogador de teste'), findsOneWidget);
    expect(find.text('Composição da pontuação'), findsOneWidget);
    expect(find.text('Vitórias'), findsWidgets);
    expect(find.text('Total calculado'), findsOneWidget);
    expect(find.text('15'), findsWidgets);
  });

}
