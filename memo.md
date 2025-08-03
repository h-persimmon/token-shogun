#order-service.ts を編集して、以下の処理を実装してください。
画面からユーザプロンプトをうけとる
例：
```
忍者を配置、侍は河童を狙え
```

ユーザプロンプトと一緒にゲーム内状況を送信する
例：
```
ユニットID, ユニット種別, x座標, y座標, 最大体力, 現在体力, 発生イベント
ally-1-samurai, 侍, 20, 20, 500, 50, -
enemy-1-dragon, 竜, 30, 20, 2000, 800, -
enemy-2-kappa, 河童, 34, 22, 300, 70, -
```
AIが返すべきXML
```xml
<order>
    <create>
        <unit>
            <type>忍者</type>
        </unit>
    </create>
    <update>
        <unit>
            <id>samurai001</id>
            <recognize_as_first_priority>kappa001</recognize_as_first_priority>
        </unit>
    </update>
</order>
```
- 行う処理
  - 忍者を配置（既存のユニットとは重複しないIDをふる）
  - 侍のrecognize_as_first_priorityをユニット（kappa001）に変更
