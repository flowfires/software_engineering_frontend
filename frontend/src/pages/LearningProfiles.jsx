import React, { useEffect, useState } from 'react'
import { Button, List, message, Spin, Empty, Modal, Form, Input, Select, Tag, Row, Col, Typography, Tabs, InputNumber, Descriptions, Divider } from 'antd'
import { PlusOutlined, RobotOutlined, MinusCircleOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import api from '../services/api'
// 引入新拆分的组件
import LearningProfileCard from '../components/LearningProfileCard'

const { Title, Text } = Typography
const { TextArea } = Input

export default function LearningProfiles() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  
  // 编辑/新建 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState(null)
  
  // AI分析 弹窗状态
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false)
  const [analyzeText, setAnalyzeText] = useState('')
  const [analyzeResult, setAnalyzeResult] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  // 【新增】查看详情 弹窗状态
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [viewingItem, setViewingItem] = useState(null)

  // 加载数据
  const load = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/learning_profile/')
      const list = Array.isArray(resp.data) ? resp.data : (resp.data.items || [])
      setData(list)
    } catch (err) {
      console.warn('后端不可用')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // 处理查看详情
  const handleView = (item) => {
    setViewingItem(item)
    setViewModalVisible(true)
  }

  // AI 智能诊断逻辑
  const handleAnalyzeClick = (item) => {
    const p = item.profile || {}
    const scope = p.scope || {}
    const mistakes = p.common_mistakes || []
    const suggestions = p.teaching_suggestions || []
    
    const text = `班级：${item.title}\n科目：${scope.grade}${scope.subject}\n易错点：${mistakes.map(m=>m.knowledge_point).join('、')}\n教学建议：${suggestions.join('；')}\n\n请生成一份针对该班级的备课策略。`
    setAnalyzeText(text)
    setAnalyzeResult(null)
    setAnalyzeModalVisible(true)
  }

  // 编辑逻辑
  const handleEditClick = (item) => {
     setEditingId(item.id)
     const p = item.profile || {}
     const scope = p.scope || {}
     const level = p.overall_learning_level || {}
     const behavior = p.learning_behavior || {}
     const prior = p.prior_knowledge || {}
     const mistakes = p.common_mistakes || []
     
     form.setFieldsValue({
       title: item.title,
       subject: scope.subject,
       grade: scope.grade,
       overall_level: level.overall_level,
       strong_ratio: parseInt(level.strong_ratio) || 0,
       average_ratio: parseInt(level.average_ratio) || 0,
       weak_ratio: parseInt(level.weak_ratio) || 0,
       
       behavior_calc: behavior.calculation_skill,
       behavior_concept: behavior.conceptual_understanding,
       behavior_class: behavior.class_participation,
       behavior_homework: behavior.homework_completion,
       
       common_mistakes: mistakes.map(m => m.knowledge_point),
       mastered_knowledge: prior.mastered_knowledge_points || [],
       partial_knowledge: prior.partially_mastered_knowledge_points || [],
       teaching_suggestions: p.teaching_suggestions || [],
       remarks: p.remarks
     })
     setModalVisible(true)
  }

  // 删除逻辑
  const handleDeleteClick = async (id, title) => {
    if (typeof id === 'string' && id.startsWith('mock')) {
       setData(data.filter(item => item.id !== id))
       message.success('已删除 (演示)')
       return
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除「${title}」的档案吗？`,
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/learning_profile/${id}`)
          message.success('已删除')
          load()
        } catch (err) {
          message.error('删除失败')
        }
      }
    })
  }

  // 提交表单 (保存)
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        title: values.title,
        profile: {
          scope: {
            subject: values.subject,
            grade: values.grade,
            class_name: values.title,
            semester: '2024-Spring'
          },
          overall_learning_level: {
            overall_level: values.overall_level,
            strong_ratio: `${values.strong_ratio || 0}%`,
            average_ratio: `${values.average_ratio || 0}%`,
            weak_ratio: `${values.weak_ratio || 0}%`
          },
          prior_knowledge: {
            mastered_knowledge_points: values.mastered_knowledge || [],
            partially_mastered_knowledge_points: values.partial_knowledge || []
          },
          common_mistakes: (values.common_mistakes || []).map(m => ({ 
            knowledge_point: m,
            description: '教师手动录入',
            frequency: 'High'
          })),
          learning_behavior: {
             calculation_skill: values.behavior_calc,
             conceptual_understanding: values.behavior_concept,
             class_participation: values.behavior_class,
             homework_completion: values.behavior_homework
          },
          teaching_suggestions: values.teaching_suggestions || [],
          remarks: values.remarks
        }
      }

      if (editingId) {
        if (typeof editingId === 'string' && editingId.startsWith('mock')) {
           const newData = data.map(item => item.id === editingId ? { ...item, ...payload, id: editingId } : item)
           setData(newData)
           message.success('更新成功 (演示)')
           setModalVisible(false)
           return
        }
        await api.put(`/learning_profile/${editingId}`, payload)
        message.success('更新成功')
      } else {
        if (data.some(d => typeof d.id === 'string' && d.id.startsWith('mock'))) {
           const newMock = { ...payload, id: `mock-${Date.now()}` }
           setData([newMock, ...data])
           message.success('创建成功 (演示)')
           setModalVisible(false)
           return
        }
        await api.post('/learning_profile/', payload)
        message.success('创建成功')
      }
      setModalVisible(false)
      load()
    } catch (err) {
      console.error(err)
      message.error(err?.response?.data?.detail || '保存失败')
    }
  }

  // 动态列表组件
  const DynamicList = ({ name, placeholder, btnText }) => (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <>
          {fields.map((field) => (
            <div key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
              <Form.Item {...field} noStyle>
                <Input placeholder={placeholder} />
              </Form.Item>
              <MinusCircleOutlined
                onClick={() => remove(field.name)}
                style={{ marginLeft: 8, marginTop: 8, color: 'red', cursor: 'pointer' }}
              />
            </div>
          ))}
          <Form.Item>
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              {btnText}
            </Button>
          </Form.Item>
        </>
      )}
    </Form.List>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>班级学情分析</Title>
          <Text type="secondary">记录班级学情数据，赋能精准备课</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingId(null)
          form.resetFields()
          setModalVisible(true)
        }}>
          新建档案
        </Button>
      </div>

      <Spin spinning={loading}>
        {data.length === 0 ? (
          <Empty description="暂无班级档案，请先创建" />
        ) : (
          <List
            grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
            dataSource={data}
            renderItem={(item) => (
              <List.Item>
                {/* 使用拆分后的组件，并传入事件处理函数 */}
                <LearningProfileCard 
                  item={item} 
                  onClick={handleView}
                  onAnalyze={handleAnalyzeClick}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </List.Item>
            )}
          />
        )}
      </Spin>

      {/* 查看详情弹窗 (新增) */}
      <Modal
        title="档案详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>,
          <Button key="analyze" type="primary" icon={<RobotOutlined />} onClick={() => {
             setViewModalVisible(false);
             handleAnalyzeClick(viewingItem);
          }}>智能诊断</Button>
        ]}
        width={800}
      >
        {viewingItem && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
            <Descriptions title={viewingItem.title} bordered column={2}>
              <Descriptions.Item label="年级">{viewingItem.profile?.scope?.grade}</Descriptions.Item>
              <Descriptions.Item label="科目">{viewingItem.profile?.scope?.subject}</Descriptions.Item>
              
              <Descriptions.Item label="整体水平" span={2}>
                 <Tag color="blue">{viewingItem.profile?.overall_learning_level?.overall_level}</Tag>
                 (优: {viewingItem.profile?.overall_learning_level?.strong_ratio}, 中: {viewingItem.profile?.overall_learning_level?.average_ratio}, 差: {viewingItem.profile?.overall_learning_level?.weak_ratio})
              </Descriptions.Item>

              <Descriptions.Item label="课堂参与度">{viewingItem.profile?.learning_behavior?.class_participation}</Descriptions.Item>
              <Descriptions.Item label="作业完成度">{viewingItem.profile?.learning_behavior?.homework_completion}</Descriptions.Item>
              <Descriptions.Item label="计算能力">{viewingItem.profile?.learning_behavior?.calculation_skill}</Descriptions.Item>
              <Descriptions.Item label="概念理解">{viewingItem.profile?.learning_behavior?.conceptual_understanding}</Descriptions.Item>

              <Descriptions.Item label="已掌握知识" span={2}>
                 {viewingItem.profile?.prior_knowledge?.mastered_knowledge_points?.map(k => <Tag key={k} color="green">{k}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="薄弱/部分掌握" span={2}>
                 {viewingItem.profile?.prior_knowledge?.partially_mastered_knowledge_points?.map(k => <Tag key={k} color="orange">{k}</Tag>)}
              </Descriptions.Item>
              <Descriptions.Item label="常见易错点" span={2}>
                 {viewingItem.profile?.common_mistakes?.map(m => <Tag key={m.knowledge_point} color="red">{m.knowledge_point}</Tag>)}
              </Descriptions.Item>
              
              <Descriptions.Item label="教学建议" span={2}>
                 <ul style={{ paddingLeft: 20, margin: 0 }}>
                   {viewingItem.profile?.teaching_suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                 </ul>
              </Descriptions.Item>
              
              <Descriptions.Item label="备注" span={2}>
                {viewingItem.profile?.remarks}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 编辑/新建表单弹窗 (保持原样，省略部分重复代码，只保留结构) */}
      <Modal
        title={editingId ? "编辑档案" : "新建档案"}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          {/* ... Tabs and Form Items (与之前一致) ... */}
           <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: '基本信息',
              forceRender: true,
              children: (
                <>
                  <Form.Item name="title" label="档案名称" rules={[{ required: true }]}>
                    <Input placeholder="例如：高一(3)班 数学学情" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="grade" label="年级" rules={[{ required: true }]}>
                        <Input placeholder="例如：高一" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="subject" label="科目" rules={[{ required: true }]}>
                        <Input placeholder="例如：数学" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="remarks" label="综合评价/备注">
                    <TextArea rows={4} placeholder="班级整体氛围、特殊情况说明..." />
                  </Form.Item>
                </>
              )
            },
            {
              key: '2',
              label: '能力分布',
              forceRender: true,
              children: (
                <>
                  <Form.Item name="overall_level" label="整体水平">
                    <Select>
                      <Select.Option value="优秀">优秀</Select.Option>
                      <Select.Option value="良好">良好</Select.Option>
                      <Select.Option value="中等">中等</Select.Option>
                      <Select.Option value="薄弱">薄弱</Select.Option>
                    </Select>
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="strong_ratio" label="优生比例 (%)">
                        <InputNumber min={0} max={100} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="average_ratio" label="中等生比例 (%)">
                        <InputNumber min={0} max={100} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="weak_ratio" label="后进生比例 (%)">
                        <InputNumber min={0} max={100} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )
            },
            {
              key: '3',
              label: '学习行为',
              forceRender: true,
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="behavior_calc" label="计算/实操能力">
                      <Select placeholder="请选择"><Select.Option value="强">强</Select.Option><Select.Option value="中">中</Select.Option><Select.Option value="弱">弱</Select.Option></Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="behavior_concept" label="概念理解">
                      <Select placeholder="请选择"><Select.Option value="深">深</Select.Option><Select.Option value="中">中</Select.Option><Select.Option value="浅">浅</Select.Option></Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="behavior_class" label="课堂参与度">
                      <Select placeholder="请选择"><Select.Option value="积极">积极</Select.Option><Select.Option value="一般">一般</Select.Option><Select.Option value="消极">消极</Select.Option></Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="behavior_homework" label="作业完成度">
                      <Select placeholder="请选择"><Select.Option value="优">优</Select.Option><Select.Option value="良">良</Select.Option><Select.Option value="差">差</Select.Option></Select>
                    </Form.Item>
                  </Col>
                </Row>
              )
            },
            {
              key: '4',
              label: '知识体系',
              forceRender: true,
              children: (
                <>
                  <Form.Item label="已掌握的前置知识">
                    <DynamicList name="mastered_knowledge" placeholder="例如：一元一次方程" btnText="添加已掌握点" />
                  </Form.Item>
                  <Form.Item label="部分掌握/薄弱点">
                    <DynamicList name="partial_knowledge" placeholder="例如：应用题建模" btnText="添加薄弱点" />
                  </Form.Item>
                  <Form.Item label="常见易错点">
                    <DynamicList name="common_mistakes" placeholder="例如：符号错误" btnText="添加易错点" />
                  </Form.Item>
                  <Form.Item label="针对性教学建议">
                    <DynamicList name="teaching_suggestions" placeholder="例如：加强课前测验" btnText="添加建议" />
                  </Form.Item>
                </>
              )
            }
          ]} />
        </Form>
      </Modal>

      {/* AI 分析弹窗 */}
      <Modal
        title={<span><RobotOutlined style={{ color: '#1890ff', marginRight: 8 }} />智能学情诊断</span>}
        open={analyzeModalVisible}
        onCancel={() => setAnalyzeModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>分析内容：</div>
          <TextArea rows={5} value={analyzeText} onChange={e => setAnalyzeText(e.target.value)} />
        </div>
        
        <Button type="primary" block onClick={async () => {
             setAnalyzing(true); 
             setAnalyzeResult(null);
             try {
                const r = await api.get('/ai/lps/analyze', { params: { msg: analyzeText } })
                
                // 【修改点 1】精准提取 content 字段
                // 如果后端返回结构变化，保留兜底逻辑 (r.data)
                const aiContent = r.data?.content || r.data;
                
                // 确保是字符串，如果是对象则转字符串防止报错
                setAnalyzeResult(typeof aiContent === 'string' ? aiContent : JSON.stringify(aiContent));
             } catch(e) {
                message.error('智能分析服务连接失败，请稍后重试')
             } finally { 
                setAnalyzing(false) 
             }
        }} loading={analyzing}>开始分析</Button>

        {analyzeResult && (
          <div style={{ 
            marginTop: 16, 
            padding: '16px 24px', // 增加左右内边距
            background: '#f9f9f9', // 稍微柔和一点的背景色
            borderRadius: 8, 
            border: '1px solid #e8e8e8', // 增加边框增加层次感
            maxHeight: 500, 
            overflowY: 'auto',
            lineHeight: '1.8', // 增加行高，提升阅读体验
            color: '#333'
          }}>
            <ReactMarkdown 
              components={{
                // 自定义一些样式，防止 Markdown 默认样式被 AntD 覆盖或太丑
                h3: ({node, ...props}) => <h3 style={{ color: '#1890ff', marginTop: '1em', marginBottom: '0.5em' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ paddingLeft: 20 }} {...props} />,
                li: ({node, ...props}) => <li style={{ marginBottom: 4 }} {...props} />,
                strong: ({node, ...props}) => <strong style={{ color: '#000', fontWeight: 600 }} {...props} />
              }}
            >
              {analyzeResult}
            </ReactMarkdown>
          </div>
        )}
      </Modal>
    </div>
  )
}