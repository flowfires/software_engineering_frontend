import React, { useState, useEffect } from 'react'
import { Button, Input, Space, message, Form, Select, InputNumber, Tabs, Modal, Progress, Card, Timeline, Typography, Alert, Divider, Empty } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
// 修正：将 ClockOutlined 改为 ClockCircleOutlined
import { BookOutlined, ClockCircleOutlined, EditOutlined, CheckCircleOutlined, SaveOutlined, RobotOutlined, RollbackOutlined } from '@ant-design/icons'
import api from '../services/api'

const { TextArea } = Input
const { TabPane } = Tabs
const { Title, Text } = Typography

// =======================================================
// 辅助函数与组件
// =======================================================

// 清洗 Markdown 标记
const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/^```markdown\n/, '').replace(/^```\n/, '').replace(/\n```$/, '').replace(/```$/, '');
};

// 渲染文本块
const MarkdownBlock = ({ content, style }) => (
  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px', color: '#333', ...style }}>
    {cleanText(content) || <Text type="secondary">（暂无内容）</Text>}
  </div>
);

export default function LessonEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [content, setContent] = useState('') // 这里存储的是字符串格式的 JSON
  const [lessonData, setLessonData] = useState({
    lesson_title: '',
    subject: '',
    grade: '',
    lesson_type: '',
    class_duration: 45,
    lesson_count: 1,
    notes: ''
  })
  
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [taskId, setTaskId] = useState(null)
  const [progress, setProgress] = useState(0)

  // 加载数据
  useEffect(() => {
    if (id && id !== 'new') {
      api.get(`/lesson/${id}`).then((r) => {
        setLessonData({
          lesson_title: r.data?.lesson_title || '',
          subject: r.data?.subject || '',
          grade: r.data?.grade || '',
          lesson_type: r.data?.lesson_type || '',
          class_duration: r.data?.class_duration || 45,
          lesson_count: r.data?.lesson_count || 1,
          notes: r.data?.notes || ''
        })

        // 处理内容显示
        let contentDisplay = '';
        const rawContent = r.data?.content;

        if (rawContent) {
          if (typeof rawContent === 'string') {
             contentDisplay = rawContent;
          } else if (typeof rawContent === 'object') {
             if (rawContent.text && Object.keys(rawContent).length === 1) {
               contentDisplay = rawContent.text; 
             } else {
               contentDisplay = JSON.stringify(rawContent, null, 2);
             }
          }
        }
        setContent(contentDisplay)

      }).catch(err => {
        message.error('加载教案失败')
      })
    }
  }, [id])

  // 解析当前内容为对象（用于预览）
  const getParsedContent = () => {
    try {
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      return null;
    }
  }

  const save = async () => {
    if (!lessonData.lesson_title.trim()) {
      message.warning('请输入教案标题')
      return
    }

    setSaving(true)
    try {
      let contentObj
      try {
        contentObj = typeof content === 'string' ? JSON.parse(content) : content
      } catch {
        contentObj = { text: content } // 无法解析则作为纯文本保存
      }

      const payload = { 
        ...lessonData,
        content: contentObj 
      }

      if (id === 'new' || !id || id === 'undefined') {
        const resp = await api.post('/lesson', payload)
        message.success('已创建')
        const newId = resp.data?.id || resp.data?.lesson?.id || resp.data?.data?.id
        if (newId) {
          navigate(`/lessons/${newId}`, { replace: true })
        } else {
          navigate('/lessons')
        }
      } else {
        await api.put(`/lesson/${id}`, payload)
        message.success('已保存')
      }
    } catch (err) {
      console.error(err)
      message.error(`保存失败: ${err?.response?.data?.detail || '未知错误'}`)
    } finally {
      setSaving(false)
    }
  }

  // AI 生成相关逻辑
  const pollGenerationStatus = async (tid) => {
    try {
      const resp = await api.get('/ai/lesson/generate/status', { params: { task_id: tid } })
      const status = resp.data?.task_status || resp.data?.status
      const progressVal = resp.data?.progress || 0
      
      setProgress(progressVal)
      
      if (status === 'completed' || status === 'SUCCESS') {
        setGenerating(false)
        setTaskId(null)
        if (resp.data?.partial_lesson || resp.data?.lesson) {
          const result = resp.data.partial_lesson || resp.data.lesson
          setContent(JSON.stringify(result, null, 2))
          message.success('AI 生成完成！')
        } else {
          message.info('生成完成，但未返回内容')
        }
      } else if (status === 'failed' || status === 'FAIL') {
        setGenerating(false)
        setTaskId(null)
        message.error(resp.data?.error || 'AI 生成失败')
      } else {
        setTimeout(() => pollGenerationStatus(tid), 2000)
      }
    } catch (err) {
      setGenerating(false)
      setTaskId(null)
    }
  }

  const generateWithAI = async () => {
    if (!lessonData.lesson_title) {
      message.warning('请先输入教案标题')
      return
    }
    setGenerating(true)
    setProgress(0)
    try {
      const clarifyData = {
        subject: lessonData.subject,
        grade: lessonData.grade,
        lesson_title: lessonData.lesson_title,
        lesson_type: lessonData.lesson_type,
        class_duration: lessonData.class_duration,
        lesson_count: lessonData.lesson_count,
        notes: lessonData.notes
      }
      const r = await api.post('/ai/lesson/generate', { clarify: clarifyData })
      if (r.data?.task_id) {
        setTaskId(r.data.task_id)
        message.info('AI 生成任务已提交...')
        pollGenerationStatus(r.data.task_id)
      } else {
        setGenerating(false)
        message.error('未返回任务ID')
      }
    } catch (err) {
      setGenerating(false)
      message.error('AI 生成失败')
    }
  }

  // =======================================================
  // 渲染预览视图 (核心逻辑)
  // =======================================================
  const renderPreview = () => {
    const data = getParsedContent();

    // 1. 如果数据是纯字符串（不是 JSON 对象），直接显示文本
    if (!data || typeof data !== 'object') {
      return (
        <Card title="内容预览">
           <Empty description="当前内容非结构化数据，请切换到“源码模式”查看或编辑" />
           {content && <div style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>{content}</div>}
        </Card>
      );
    }

    // 2. 结构化数据渲染
    const flow = data.teaching_flow || {};
    
    // 定义 Tabs 内容
    const items = [
      {
        key: 'overview',
        label: <span><BookOutlined /> 教学目标与重难点</span>,
        children: (
          <div style={{ padding: '8px 0' }}>
            <Card title="教学目标" type="inner" style={{ marginBottom: 16 }}>
              <MarkdownBlock content={data.objectives} />
            </Card>
            <Card title="教学重难点" type="inner">
              <MarkdownBlock content={data.key_points} />
            </Card>
          </div>
        )
      },
      {
        key: 'process',
        // 修正：使用 ClockCircleOutlined
        label: <span><ClockCircleOutlined /> 教学过程</span>,
        children: (
          <div style={{ padding: '8px 0' }}>
             {Object.keys(flow).length === 0 ? <Empty description="暂无流程数据" /> : (
              <Timeline mode="left">
                {flow.introduction && (
                  <Timeline.Item color="green" label="导入">
                    <Card size="small" title="导入新课" style={{ marginBottom: 10 }}>
                      <MarkdownBlock content={flow.introduction} />
                    </Card>
                  </Timeline.Item>
                )}
                {flow.main && (
                  <Timeline.Item color="blue" label="讲授">
                    <Card size="small" title="新授环节" style={{ marginBottom: 10 }}>
                      <MarkdownBlock content={flow.main} />
                    </Card>
                  </Timeline.Item>
                )}
                {flow.practice && (
                  <Timeline.Item color="orange" label="练习">
                    <Card size="small" title="课堂练习" style={{ marginBottom: 10 }}>
                      <MarkdownBlock content={flow.practice} />
                    </Card>
                  </Timeline.Item>
                )}
                {flow.summary && (
                  <Timeline.Item color="red" label="小结">
                    <Card size="small" title="课堂小结">
                      <MarkdownBlock content={flow.summary} />
                    </Card>
                  </Timeline.Item>
                )}
              </Timeline>
             )}
          </div>
        )
      },
      {
        key: 'board',
        label: <span><EditOutlined /> 板书与作业</span>,
        children: (
          <div style={{ padding: '8px 0' }}>
            <Card title="板书设计" type="inner" style={{ marginBottom: 16 }}>
              <div style={{ 
                background: '#333', 
                color: '#fff', 
                padding: 16, 
                borderRadius: 8, 
                fontFamily: 'Consolas, Monaco, monospace', 
                whiteSpace: 'pre',
                overflowX: 'auto'
              }}>
                {cleanText(data.board_design) || '（暂无板书设计）'}
              </div>
            </Card>
            <Card title="作业布置" type="inner">
              <MarkdownBlock content={data.homework} />
            </Card>
          </div>
        )
      },
      {
        key: 'reflect',
        label: <span><CheckCircleOutlined /> 教学反思</span>,
        children: (
          <div style={{ padding: '8px 0' }}>
            <Card type="inner">
               <Alert message="提示：此部分为教学预案反思，课后可根据实际情况修改。" type="info" showIcon style={{ marginBottom: 16 }} />
               <MarkdownBlock content={data.remarks} />
            </Card>
          </div>
        )
      }
    ];

    return <Tabs defaultActiveKey="overview" items={items} type="card" />;
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card bordered={false} title={
        <Space>
           <Button icon={<RollbackOutlined />} onClick={() => navigate('/lessons')}>返回</Button>
           <span>{id === 'new' ? '新建教案' : '编辑教案'}</span>
        </Space>
      }>
        <Form layout="vertical">
          {/* 基本信息区域 */}
          <div style={{ background: '#fafafa', padding: 20, borderRadius: 8, marginBottom: 24 }}>
            <Form.Item label="教案标题" required style={{ marginBottom: 16 }}>
              <Input 
                size="large"
                value={lessonData.lesson_title}
                onChange={(e) => setLessonData({ ...lessonData, lesson_title: e.target.value })}
                placeholder="请输入教案标题"
              />
            </Form.Item>
            
            <Space size="large" wrap>
              <Form.Item label="科目" style={{ marginBottom: 0 }}>
                <Input
                  value={lessonData.subject}
                  onChange={(e) => setLessonData({ ...lessonData, subject: e.target.value })}
                  style={{ width: 150 }}
                  placeholder="例如：数学"
                />
              </Form.Item>
              
              <Form.Item label="年级" style={{ marginBottom: 0 }}>
                <Select 
                  value={lessonData.grade}
                  onChange={(val) => setLessonData({ ...lessonData, grade: val })}
                  style={{ width: 120 }}
                  placeholder="选择年级"
                >
                  {['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三'].map(g => (
                    <Select.Option key={g} value={g}>{g}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item label="课型" style={{ marginBottom: 0 }}>
                <Select 
                  value={lessonData.lesson_type}
                  onChange={(val) => setLessonData({ ...lessonData, lesson_type: val })}
                  style={{ width: 120 }}
                >
                  <Select.Option value="新授课">新授课</Select.Option>
                  <Select.Option value="复习课">复习课</Select.Option>
                  <Select.Option value="习题课">习题课</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="时长" style={{ marginBottom: 0 }}>
                <InputNumber 
                  value={lessonData.class_duration}
                  onChange={(val) => setLessonData({ ...lessonData, class_duration: val })}
                  addonAfter="分钟"
                />
              </Form.Item>
            </Space>

            <Form.Item label="备注" style={{ marginTop: 16, marginBottom: 0 }}>
               <Input.TextArea 
                  rows={1} 
                  value={lessonData.notes}
                  onChange={(e) => setLessonData({ ...lessonData, notes: e.target.value })}
                  placeholder="其他说明..."
               />
            </Form.Item>
          </div>
          
          {/* AI 生成进度条 */}
          {generating && (
            <div style={{ marginBottom: 24 }}>
              <Progress percent={progress} status="active" />
              <div style={{ textAlign: 'center', marginTop: 8, color: '#1890ff' }}>
                <RobotOutlined /> AI 正在生成内容...
              </div>
            </div>
          )}
          
          {/* 核心内容区：预览 vs 源码 */}
          <Tabs defaultActiveKey="preview" type="line" tabBarStyle={{ marginBottom: 24 }}>
            <TabPane tab="👁️ 预览模式" key="preview">
              {renderPreview()}
            </TabPane>
            
            <TabPane tab="📝 源码模式" key="source">
              <Alert 
                message="编辑说明" 
                description="此处可以直接编辑 JSON 源码，修改后点击保存即可更新预览。请小心保持 JSON 格式正确。" 
                type="warning" 
                showIcon 
                style={{ marginBottom: 16 }} 
              />
              <TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={25}
                style={{ fontFamily: 'monospace', fontSize: 13 }}
                placeholder="在此输入或编辑教案内容（支持 JSON 格式）"
              />
            </TabPane>
          </Tabs>
          
          <Divider />

          {/* 底部按钮 */}
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">
              <Button size="large" onClick={() => navigate('/lessons')}>取消</Button>
              <Button 
                 size="large" 
                 icon={<RobotOutlined />} 
                 onClick={generateWithAI} 
                 loading={generating} 
                 disabled={generating}
              >
                AI 重新生成
              </Button>
              <Button 
                type="primary" 
                size="large" 
                icon={<SaveOutlined />} 
                onClick={save} 
                loading={saving}
              >
                保存教案
              </Button>
            </Space>
          </div>

        </Form>
      </Card>
    </div>
  )
}