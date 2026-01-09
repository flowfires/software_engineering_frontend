import React, { useEffect, useState, useCallback } from 'react'
import { Row, Col, Card, Button, Tag, message, Space, Input, Empty, Typography, Divider, Tabs, Tooltip } from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined, 
  CloudUploadOutlined, 
  ThunderboltOutlined, 
  DeleteOutlined, 
  FileImageOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import api from '../services/api'
import ResourceUpload from '../components/ResourceUpload'
import AiImageGenerator from '../components/AiImageGenerator' // 引入新组件

const { Title, Text } = Typography

export default function Resources() {
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState([])
  const [tags, setTags] = useState([])
  const [activeTab, setActiveTab] = useState('all') // 'all' or specific tag
  const [showUpload, setShowUpload] = useState(false)
  const [showAiGenerator, setShowAiGenerator] = useState(false) // AI 弹窗状态
  const [search, setSearch] = useState('')
  const [newTag, setNewTag] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await api.get('/resource/list')
      if (Array.isArray(resp.data)) {
        setResources(resp.data)
      } else {
        setResources([])
      }

      // load tags
      try {
        const t = await api.get('/resource/tags')
        if (Array.isArray(t.data)) setTags(t.data)
      } catch (e) {
        // ignore tag errors
      }
    } catch (err) {
      // 这里的错误提示可以根据实际情况决定是否显示，避免 Mock 环境下一直报错
      console.warn('资源加载失败', err)
      setResources([]) 
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onUploaded = () => load()

  const onDelete = async (id) => {
    try {
      await api.delete(`/resource/${id}`)
      message.success('已删除')
      load()
    } catch (err) {
      message.error('删除失败')
    }
  }

  const handleAddTag = async () => {
    const val = newTag.trim()
    if (!val) return
    try {
      await api.post('/resource/tags', { tag: val })
      message.success('标签已创建')
      setNewTag('')
      const tt = await api.get('/resource/tags')
      if (Array.isArray(tt.data)) setTags(tt.data)
    } catch (err) {
      message.error('创建标签失败')
    }
  }

  // 过滤逻辑：搜索词 + 标签（Tab）
  const filtered = resources.filter((r) => {
    const matchesSearch = search ? (r.name || r.title || '').toLowerCase().includes(search.toLowerCase()) : true
    const matchesTag = activeTab === 'all' ? true : (r.tags || r.tag || '').toString().includes(activeTab)
    return matchesSearch && matchesTag
  })

  // 标签页配置
  const tabItems = [
    { label: '全部资源', key: 'all' },
    ...tags.map(t => ({ label: t, key: t }))
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* 顶部工具栏卡片 */}
      <Card bordered={false} bodyStyle={{ padding: '24px' }} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <AppstoreOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              资源中心
            </Title>
            <Text type="secondary">集中管理教学素材，支持上传与 AI 生成</Text>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <Input.Search 
              placeholder="搜索资源名称..." 
              onSearch={(v) => setSearch(v)} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260 }} 
              allowClear
            />
            
            <Button 
              type="default" 
              icon={<ThunderboltOutlined style={{ color: '#faad14' }} />} 
              onClick={() => setShowAiGenerator(true)}
              style={{ borderColor: '#faad14', color: '#faad14' }}
            >
              AI 生成素材
            </Button>
            
            <Button 
              type="primary" 
              icon={<CloudUploadOutlined />} 
              onClick={() => setShowUpload(true)}
            >
              上传资源
            </Button>
          </div>
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* 标签管理区域 - 优化为更紧凑的行内布局 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
           <span style={{ color: '#999', fontSize: 13 }}>标签管理：</span>
           {tags.length === 0 && <span style={{ color: '#ccc', fontSize: 12 }}>暂无标签</span>}
           {tags.map((t) => (
            <Tag
              key={t}
              closable
              onClose={async (e) => {
                e.preventDefault();
                try {
                  await api.delete(`/resource/tags/${encodeURIComponent(t)}`)
                  message.success('标签已删除')
                  const tt = await api.get('/resource/tags')
                  if (Array.isArray(tt.data)) setTags(tt.data)
                  if (activeTab === t) setActiveTab('all')
                } catch (err) { message.error('删除失败') }
              }}
            >
              {t}
            </Tag>
          ))}
          <Input
            size="small"
            placeholder="+ 新标签"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onPressEnter={handleAddTag}
            style={{ width: 100, fontSize: 12 }}
          />
          {newTag && <Button size="small" type="link" onClick={handleAddTag}>保存</Button>}
        </div>
      </Card>

      {/* 资源列表区域 */}
      <Card bordered={false} bodyStyle={{ padding: '0 24px 24px 24px' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          items={tabItems} 
          tabBarStyle={{ marginBottom: 24 }}
        />

        {filtered.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description={
              <span>
                暂无资源，试试 <a onClick={() => setShowAiGenerator(true)}>AI 生成</a> 或 <a onClick={() => setShowUpload(true)}>上传</a>
              </span>
            } 
          />
        ) : (
          <Row gutter={[24, 24]}>
            {filtered.map((r) => (
              <Col key={r.id || r.name} xs={24} sm={12} md={8} lg={6} xl={4}>
                <Card
                  hoverable
                  style={{ borderRadius: 8, overflow: 'hidden' }}
                  bodyStyle={{ padding: 12 }}
                  cover={
                    <div 
                      style={{ 
                        height: 140, 
                        background: '#f5f5f5', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderBottom: '1px solid #f0f0f0',
                        overflow: 'hidden'
                      }}
                    >
                      {r.content_url ? (
                        <img alt={r.name} src={r.content_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FileImageOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                      )}
                    </div>
                  }
                  actions={[
                    <Tooltip title="拖拽可插入教案"><span style={{ cursor: 'move' }}>✋ 拖拽</span></Tooltip>,
                    <Tooltip title="删除"><DeleteOutlined key="delete" onClick={() => onDelete(r.id)} /></Tooltip>
                  ]}
                  // 拖拽逻辑
                  onDragStart={(e) => {
                    const payload = JSON.stringify({ url: r.content_url, type: r.resource_type || 'image', title: r.name })
                    e.dataTransfer.setData('application/resource', payload)
                  }}
                  draggable
                >
                  <Card.Meta 
                    title={
                      <Tooltip title={r.name || r.title}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.name || r.title || '未命名资源'}
                        </div>
                      </Tooltip>
                    }
                    description={
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {(r.tags || r.tag || '').toString() || '无标签'}
                      </div>
                    } 
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 弹窗组件 */}
      <ResourceUpload visible={showUpload} onCancel={() => setShowUpload(false)} onUploaded={onUploaded} />
      <AiImageGenerator visible={showAiGenerator} onCancel={() => setShowAiGenerator(false)} />
    </div>
  )
}