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
}
