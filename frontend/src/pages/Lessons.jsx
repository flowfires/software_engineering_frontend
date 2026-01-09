import React, { useEffect, useState } from 'react'
import { Button, Card, List, message, Spin, Empty, Modal, Select, Input, Space } from 'antd'
import { Link } from 'react-router-dom'
import api from '../services/api'

const { Search } = Input

export default function Lessons() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({ subject: null, grade: null })

  const load = async (page = 1, filterParams = filters) => {
    setLoading(true)
    try {
      const params = { page, page_size: pagination.pageSize }
      if (filterParams.subject) params.subject = filterParams.subject
      if (filterParams.grade) params.grade = filterParams.grade
      
      const resp = await api.get('/lesson/list', { params })
      if (resp.data && Array.isArray(resp.data.items || resp.data)) {
        setData(resp.data.items || resp.data)
        setPagination(prev => ({
          ...prev,
          page,
          total: resp.data.total || (resp.data.items || resp.data).length
        }))
      } else {
        setData([])
      }
    } catch (err) {
      message.error('获取教案列表失败')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, title) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除教案「${title}」吗？此操作不可恢复。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/lesson/${id}`)
          message.success('删除成功')
          load(pagination.page)
        } catch (err) {
          message.error(err?.response?.data?.detail || '删除失败')
        }
      }
    })
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    load(1, newFilters)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Input
              placeholder="筛选科目"
              style={{ width: 120 }}
              allowClear
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
            <Select
              placeholder="筛选年级"
              style={{ width: 120 }}
              allowClear
              value={filters.grade}
              onChange={(val) => handleFilterChange('grade', val)}
            >
              <Select.Option value="一年级">一年级</Select.Option>
              <Select.Option value="二年级">二年级</Select.Option>
              <Select.Option value="三年级">三年级</Select.Option>
              <Select.Option value="四年级">四年级</Select.Option>
              <Select.Option value="五年级">五年级</Select.Option>
              <Select.Option value="六年级">六年级</Select.Option>
            </Select>
          </Space>
          <Space>
            <Button type="primary">
              <Link to="/lessons/wizard">AI生成教案</Link>
            </Button>
            <Button>
              <Link to="/lessons/new">手动创建</Link>
            </Button>
          </Space>
        </div>
      </Space>
      
      <Spin spinning={loading}>
        {data.length === 0 && !loading ? (
          <Empty description="暂无教案" />
        ) : (
          <List
            grid={{ gutter: 16, column: 2 }}
            dataSource={data}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: load,
              showTotal: (total) => `共 ${total} 条`
            }}
            renderItem={(item) => (
              <List.Item>
                <Card 
                  title={item.lesson_title || item.title || '未命名教案'} 
                  extra={
                    <Space>
                      <Link to={`/lessons/${item.id}`}>编辑</Link>
                      <Button 
                        type="link" 
                        danger 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id, item.lesson_title || item.title)
                        }}
                      >
                        删除
                      </Button>
                    </Space>
                  }
                >
                  <div>
                    {item.subject && <span>科目: {item.subject} </span>}
                    {item.grade && <span>年级: {item.grade}</span>}
                  </div>
                  <div style={{ marginTop: 8, color: '#666', fontSize: '12px' }}>
                    {item.lesson_type && <span>{item.lesson_type} | </span>}
                    {item.notes || '暂无描述'}
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  )
}
