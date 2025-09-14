export const llmOutputSchema = `
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">

  <!-- Root LLMOutput element -->
  <xs:element name="llmOutput">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="orders" type="OrdersType" minOccurs="1" maxOccurs="1"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>

  <!-- Orders collection type -->
  <xs:complexType name="OrdersType">
    <xs:sequence>
      <xs:element name="order" type="OrderType" minOccurs="0" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Order type (union of all order types) -->
  <xs:complexType name="OrderType">
    <xs:choice>
      <xs:element name="attackTarget" type="AttackTargetOrderType"/>
      <xs:element name="deploymentTarget" type="DeploymentTargetOrderType"/>
      <xs:element name="defenseCrystal" type="DefenseCrystalOrderType"/>
      <xs:element name="reviveAllyUnit" type="ReviveAllyUnitOrderType"/>
    </xs:choice>
  </xs:complexType>

  <!-- Attack Target Order -->
  <xs:complexType name="AttackTargetOrderType">
    <xs:sequence>
      <xs:element name="entityId" type="xs:string"/>
      <xs:element name="targetEnemyTypeId" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Deployment Target Order -->
  <xs:complexType name="DeploymentTargetOrderType">
    <xs:sequence>
      <xs:element name="entityId" type="xs:string"/>
      <xs:element name="targetStructureId" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Defense Crystal Order -->
  <xs:complexType name="DefenseCrystalOrderType">
    <xs:sequence>
      <xs:element name="entityId" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Revive Ally Unit Order -->
  <xs:complexType name="ReviveAllyUnitOrderType">
    <xs:sequence>
      <xs:element name="entityId" type="xs:string"/>
    </xs:sequence>
  </xs:complexType>

</xs:schema>
`