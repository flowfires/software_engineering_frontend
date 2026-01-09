import React, { useState, useEffect } from 'react'
import { Button, Input, Form, InputNumber, Select, Card, message, Spin, Space, Typography } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const { TextArea } = Input
const { Title } = Typography
const { Option } = Select

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
      
      // 格式化 exercises 数组为 JSON 字符串方便编辑，或者你可以做一个复杂的动态表单
      // 这里为了简单，我们让用户直接编辑 JSON 格式的题目内容
      const exercisesJson = JSON.stringify(data.exercises || [], null, 2)
      
      form.setFieldsValue({
        title: data.title,
        purpose: data.purpose,
        overall_difficulty: data.overall_difficulty,
        suggested_duration_minutes: data.suggested_duration_minutes,
        exercises_content: exercisesJson
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
      let parsedExercises = []
      try {
        parsedExercises = JSON.parse(values.exercises_content)
      } catch (e) {
        message.error('题目内容 JSON 格式有误，请检查')
        setSaving(false)
        return
      }

      const payload = {
        title: values.title,
        purpose: values.purpose,
        overall_difficulty: values.overall_difficulty,
        suggested_duration_minutes: values.suggested_duration_minutes,
        exercises: parsedExercises
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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exercises')}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>编辑习题</Title>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Card>
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item name="title" label="习题标题" rules={[{ required: true }]}>
              <Input placeholder="例如：勾股定理基础练习" />
            </Form.Item>

            <Space size="large" style={{ display: 'flex', marginBottom: 8 }}>
              <Form.Item name="overall_difficulty" label="整体难度" style={{ width: 200 }}>
                <Select placeholder="选择难度">
                  <Option value="基础">基础</Option>
                  <Option value="进阶">进阶</Option>
                  <Option value="拔高">拔高</Option>
                </Select>
              </Form.Item>

              <Form.Item name="suggested_duration_minutes" label="建议时长 (分钟)" style={{ width: 200 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item name="purpose" label="用途" style={{ width: 200 }}>
                <Input placeholder="例如：课后作业" />
              </Form.Item>
            </Space>

            <Form.Item 
              name="exercises_content" 
              label="题目内容 (JSON格式)" 
              tooltip="请保持标准的 JSON 格式，包含 question, options, answer, analysis 等字段"
              rules={[{ required: true, message: '请输入题目内容' }]}
            >
              <TextArea rows={15} style={{ fontFamily: 'monospace' }} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  )
}