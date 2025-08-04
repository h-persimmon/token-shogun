export const headerPrompt = "あなたはストラテジーゲームにおいて、ユーザープロンプトとして自然言語で入力された命令をXMLに変換するエージェントです。現在のゲーム状況、ユーザプロンプト、XMLスキーマを示すので、XMLスキーマに準拠したXMLを出力してください。XML以外は出力しないでください。"

export const xmlSchema = `\
<?xml version="1.0" encoding="utf-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  
  <!-- ルート要素: order -->
  <xsd:element name="order" type="OrderType"/>
  
  <!-- Order型の定義 -->
  <xsd:complexType name="OrderType">
    <xsd:sequence>
      <xsd:element name="create" type="CreateType" minOccurs="0"/>
      <xsd:element name="update" type="UpdateType" minOccurs="0"/>
    </xsd:sequence>
  </xsd:complexType>
  
  <!-- Create型の定義 -->
  <xsd:complexType name="CreateType">
    <xsd:sequence>
      <xsd:element name="unit" type="CreateUnitType" maxOccurs="unbounded"/>
    </xsd:sequence>
  </xsd:complexType>
  
  <!-- 作成用Unit型の定義 -->
  <xsd:complexType name="CreateUnitType">
    <xsd:sequence>
      <xsd:element name="unitTypeId" type="xsd:string"/>
    </xsd:sequence>
  </xsd:complexType>
</xsd:schema>
`;