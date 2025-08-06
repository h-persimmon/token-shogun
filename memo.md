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






## 味方ユニット
### ユニット一覧
```csv
unitId(string), unitTypeId(string), positionX(number), positionY(number), currentHp(number), currentSpeed(number), currentEventId(string)
"samurai-1", "samurai", 40, 60, 400, 100, "doNothing"
"samurai-2", "samurai", 50, 70, 300, 100, "doNothing"
```
### ユニットタイプ詳細
```csv
unitTypeId(string), unitTypeName(string), maxHp(number), defaultSpeed(number)
"samurai", "侍", 500, 100
"ninja", "忍者", 300, 300
```
## 敵ユニット
### ユニット一覧
```csv
unitId(string), unitTypeId(string), positionX(number), positionY(number), currentHp(number), currentSpeed(number), currentEventId(string)
"kappa-1", "kappa", 200, 300, 200, 100, "doNothing"
"doragon-1", "dragon", 200, 250, 1800, 75, "doNothing"
```
### ユニットタイプ詳細
```csv
unitTypeId(string), unitTypeName(string), maxHp(number), defaultSpeed(number)
"kappa", "河童", 300, 100
"dragon", "竜", 2000, 75
```
## イベント
```json
{
  "samurai": [
  ],
  "kappa": [
  ],
  "dragon": [
    {
      "id": "dragonFire",
      "name": "火吹き"
    }
  ]
}
```
 