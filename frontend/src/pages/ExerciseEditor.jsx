import React, { useState, useEffect } from 'react'
import { Button, Input, Form, InputNumber, Select, Card, message, Spin, Space, Typography, Collapse, Tag, Row, Col, Divider } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, CaretRightOutlined, BarsOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const { TextArea } = Input
const { Title, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

export default function ExerciseEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 加载详情
  useEffect(() => {
    if (id) {
      loadDetail()
    }
  }, [id])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const resp = await api.get(`/ai/exercise/${id}`)
      const data = resp.data
      
      // 直接设置表单值，不需要手动转 JSON 字符串
      // 注意：确保 exercises 是一个数组，如果是 null 则设为 []
      form.setFieldsValue({
        title: data.title,
        purpose: data.purpose,
        overall_difficulty: data.overall_difficulty,
        suggested_duration_minutes: data.suggested_duration_minutes,
        exercises: data.exercises || [] 
      })
    } catch (err) {
      message.error('加载习题详情失败')
      navigate('/exercises')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values) => {
    setSaving(true)
    try {
      // values.exercises 已经是对象数组了，不需要 JSON.parse
      const payload = {
        title: values.title,
        purpose: values.purpose,
        overall_difficulty: values.overall_difficulty,
        suggested_duration_minutes: values.suggested_duration_minutes,
        exercises: values.exercises
      }

      await api.put(`/ai/exercise/${id}`, payload)
      message.success('保存成功')
      navigate('/exercises')
    } catch (err) {
      message.error(err?.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 渲染题目类型标签颜色
  const getTypeTagColor = (type) => {
    if (type?.includes('选择')) return 'blue'
    if (type?.includes('填空')) return 'cyan'
    if (type?.includes('计算')) return 'orange'
    return 'default'
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exercises')}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>编辑习题集</Title>
        </Space>
        <Space>
          <Button type="primary" onClick={() => form.submit()} icon={<SaveOutlined />} loading={saving} size="large">
            保存修改
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ overall_difficulty: '基础' }}>
          
          {/* 顶部基础信息卡片 */}
          <Card style={{ marginBottom: 24 }} title="基础信息">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item name="title" label="习题集标题" rules={[{ required: true, message: '请输入标题' }]}>
                  <Input placeholder="例如：勾股定理基础练习" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="purpose" label="用途">
                  <Input placeholder="例如：课后作业、随堂测验" size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={24}>
              <Col span={6}>
                 <Form.Item name="overall_difficulty" label="整体难度">
                  <Select>
                    <Option value="基础">基础</Option>
                    <Option value="进阶">进阶</Option>
                    <Option value="拔高">拔高</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="suggested_duration_minutes" label="建议时长 (分钟)">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 题目列表区域 */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title level={4} style={{ margin: 0 }}>题目列表</Title>
            <Text type="secondary">可展开每道题进行详细编辑</Text>
          </div>

          <Form.List name="exercises">
            {(fields, { add, remove, move }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Collapse 
                    key={key} 
                    defaultActiveKey={[]} // 默认折叠，防止页面过长
                    expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                    style={{ background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8 }}
                  >
                    <Panel
                      header={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <Space>
                             <Tag color="geekblue">Q{index + 1}</Tag>
                             {/* 动态获取当前表单中的值来显示在标题上 */}
                             <Form.Item {...restField} name={[name, 'category']} noStyle>
                               {(value) => <Tag color={getTypeTagColor(value)}>{value || '题目'}</Tag>}
                             </Form.Item>
                             <Form.Item {...restField} name={[name, 'topic']} noStyle>
                               {(value) => <Text strong>{value || '未命名知识点'}</Text>}
                             </Form.Item>
                          </Space>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => {
                              e.stopPropagation()
                              remove(name)
                            }}
                          >
                            删除
                          </Button>
                        </div>
                      }
                      key="1"
                      forceRender
                    >
                      {/* 题目详情编辑区 */}
                      <Row gutter={24}>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'category']} label="题型">
                            <Select placeholder="选择题型">
                              <Option value="选择题">选择题</Option>
                              <Option value="填空题">填空题</Option>
                              <Option value="计算题">计算题</Option>
                              <Option value="应用题">应用题</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'difficulty']} label="难度">
                            <Select>
                              <Option value="基础">基础</Option>
                              <Option value="中等">中等</Option>
                              <Option value="困难">困难</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                           <Form.Item {...restField} name={[name, 'score']} label="分值">
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item {...restField} name={[name, 'cognitive_level']} label="认知维度">
                             <Select>
                               <Option value="识记">识记</Option>
                               <Option value="理解">理解</Option>
                               <Option value="应用">应用</Option>
                               <Option value="分析">分析</Option>
                               <Option value="综合">综合</Option>
                             </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={24}>
                        <Col span={12}>
                           <Form.Item {...restField} name={[name, 'topic']} label="主题/知识点 (主)">
                             <Input placeholder="例如：二次函数" />
                           </Form.Item>
                        </Col>
                        <Col span={12}>
                           <Form.Item {...restField} name={[name, 'knowledge_points']} label="关联知识点 (标签)">
                             <Select mode="tags" placeholder="输入并回车添加知识点" />
                           </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item {...restField} name={[name, 'question_text']} label="题干内容" rules={[{ required: true, message: '请输入题干' }]}>
                        <TextArea rows={3} placeholder="输入题目描述" showCount />
                      </Form.Item>

                      {/* 只有当是选择题时，才显示选项编辑 (简单实现：文本输入每行一个，或者后续扩展为List) */}
                      {/* 为了兼容你的JSON中 options: null 的情况，这里做一个简单的判断渲染逻辑 */}
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.exercises?.[name]?.category !== currentValues.exercises?.[name]?.category
                        }
                      >
                        {({ getFieldValue }) => {
                          const category = getFieldValue(['exercises', name, 'category']);
                          return (category === '选择题' || category === '多选题') ? (
                             <Form.Item {...restField} name={[name, 'options']} label="选项列表">
                               <Select mode="tags" placeholder="输入选项，例如：A. 1, B. 2 (按回车添加)" />
                             </Form.Item>
                          ) : null;
                        }}
                      </Form.Item>

                      <Row gutter={24}>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'correct_answer']} label="参考答案" rules={[{ required: true, message: '请输入答案' }]}>
                            <TextArea rows={4} placeholder="输入标准答案" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'answer_analysis']} label="解析">
                            <TextArea rows={4} placeholder="输入题目解析" />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item {...restField} name={[name, 'question_id']} hidden>
                        <Input />
                      </Form.Item>
                      
                    </Panel>
                  </Collapse>
                ))}

                <Button type="dashed" onClick={() => add({ 
                    score: 5, 
                    category: '计算题', 
                    difficulty: '基础', 
                    knowledge_points: [],
                    question_id: `Q${Date.now()}` // 临时ID
                  })} 
                  block icon={<PlusOutlined />} size="large"
                >
                  添加一道新题目
                </Button>
              </div>
            )}
          </Form.List>

        </Form>
      </Spin>
    </div>
  )
}