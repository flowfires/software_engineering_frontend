import React from 'react'
import { Button, Card, List } from 'antd'
import { Link } from 'react-router-dom'

const sample = [
  { id: 1, title: '示例教案：三年级 加法' },
  { id: 2, title: '示例教案：古诗教学' }
]

export default function Lessons() {
  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary">
          <Link to="/lessons/new">新建教案</Link>
        </Button>
      </div>
      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={sample}
        renderItem={(item) => (
          <List.Item>
            <Card title={item.title} extra={<Link to={`/lessons/${item.id}`}>编辑</Link>}>
              简要描述
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}
