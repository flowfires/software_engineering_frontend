import React from 'react'
import { Card, Tag, Button, Typography } from 'antd'
import { 
  RobotOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined, 
  ThunderboltOutlined, 
  BulbOutlined, 
  BookOutlined 
} from '@ant-design/icons'

const { Text } = Typography

export default function LearningProfileCard({ item, onAnalyze, onEdit, onDelete, onClick }) {
  const p = item.profile || {}
  const scope = p.scope || {}
  const level = p.overall_learning_level || {}
  const mistakes = p.common_mistakes || []
  const suggestions = p.teaching_suggestions || []

  return (
    <Card 
      hoverable
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, cursor: 'pointer' }}
      // 点击卡片主体触发查看详情
      onClick={() => onClick && onClick(item)}
      actions={[
        <Button type="text" icon={<RobotOutlined />} onClick={(e) => { 
          e.stopPropagation() // 阻止冒泡，防止触发查看详情
          onAnalyze(item) 
        }}>智能诊断</Button>, 
        
        <EditOutlined key="edit" onClick={(e) => { 
          e.stopPropagation()
          onEdit(item) 
        }} />,
        
        <DeleteOutlined key="delete" onClick={(e) => { 
          e.stopPropagation()
          onDelete(item.id, item.title) 
        }} />
      ]}
    >
      <Card.Meta 
        avatar={<TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }} title={item.title}>
              {item.title}
            </span>
            <Tag color="blue">{scope.grade}{scope.subject}</Tag>
          </div>
        }
        description={
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>整体水平</Text>
              <Tag color={level.overall_level === '优秀' ? 'green' : (level.overall_level === '薄弱' ? 'red' : 'orange')}>
                {level.overall_level || '-'}
              </Tag>
            </div>
            
            {suggestions.length > 0 && (
              <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
                <BulbOutlined style={{ color: '#faad14' }} /> {suggestions.slice(0, 1).join('；')}...
              </div>
            )}

            {mistakes.length > 0 && (
              <div style={{ fontSize: 12 }}>
                 <div style={{ color: '#999', marginBottom: 4 }}><ThunderboltOutlined /> 易错点:</div>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                   {mistakes.slice(0, 2).map((m, i) => (
                     <Tag key={i} color="red" style={{ fontSize: 10, margin: 0 }}>
                       {m.knowledge_point}
                     </Tag>
                   ))}
                 </div>
              </div>
            )}
            
            {/* 提示用户可以点击 */}
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: '#bfbfbf' }}>
               点击卡片查看完整档案
            </div>
          </div>
        }
      />
    </Card>
  )
}