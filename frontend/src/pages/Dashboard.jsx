import React from 'react'
import { Card, Row, Col } from 'antd'

export default function Dashboard() {
  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="概览">待实现的仪表板组件</Card>
        </Col>
        <Col span={8}>
          <Card title="AI 状态">调用次数/余额</Card>
        </Col>
        <Col span={8}>
          <Card title="最近操作">操作日志快照</Card>
        </Col>
      </Row>
    </div>
  )
}
