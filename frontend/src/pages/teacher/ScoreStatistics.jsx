import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Table,
  Statistic,
  Row,
  Col,
  message,
  Tag,
} from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getExamList } from '@/api/exam';
import { getClassList } from '@/api/user';
import { getClassScores, getScoreStatistics, exportScores } from '@/api/score';
import { formatDateTime, downloadBlob } from '@/utils/helpers';

/**
 * 成绩统计页（教师）
 * - 选择考试与班级
 * - 班级成绩表
 * - 成绩分布图（柱状图）
 * - 分析指标（最高/最低/平均/及格率/标准差）
 * - 导出成绩单
 */
const ScoreStatistics = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [examId, setExamId] = useState(undefined);
  const [classId, setClassId] = useState(undefined);
  const [scores, setScores] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  // 加载考试与班级选项
  useEffect(() => {
    const load = async () => {
      try {
        const [examRes, classRes] = await Promise.all([
          getExamList({ page: 1, pageSize: 100 }),
          getClassList({ page: 1, pageSize: 100 }),
        ]);
        setExams(examRes.data.list || []);
        setClasses(classRes.data.list || []);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // 加载班级成绩
  const loadClassScores = async () => {
    if (!classId || !examId) return;
    setLoading(true);
    try {
      const res = await getClassScores(classId, examId);
      setScores(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 加载统计
  const loadStatistics = async () => {
    if (!examId) return;
    try {
      const res = await getScoreStatistics(examId);
      setStatistics(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadClassScores();
    loadStatistics();
  }, [examId, classId]);

  // 导出
  const handleExport = async () => {
    if (!examId) {
      message.warning('请选择考试');
      return;
    }
    try {
      const res = await exportScores(examId, classId);
      downloadBlob(res.data, `成绩单_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      message.success('导出成功');
    } catch {
      // ignore
    }
  };

  // 成绩分布柱状图配置
  const distributionOption = statistics?.distribution
    ? {
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: statistics.distribution.map((d) => d.range),
        },
        yAxis: { type: 'value', name: '人数' },
        series: [
          {
            type: 'bar',
            data: statistics.distribution.map((d) => d.count),
            itemStyle: { color: '#1677ff' },
            label: { show: true, position: 'top' },
          },
        ],
      }
    : null;

  const columns = [
    { title: '学生ID', dataIndex: 'student_id', width: 80 },
    { title: '姓名', dataIndex: 'student_name' },
    { title: '用户名', dataIndex: 'username' },
    {
      title: '成绩',
      dataIndex: 'total_score',
      render: (v) => <span style={{ fontWeight: 600 }}>{v ?? '-'}</span>,
    },
    {
      title: '是否及格',
      dataIndex: 'is_pass',
      render: (v) => (v === null || v === undefined ? '-' : <Tag color={v ? 'green' : 'red'}>{v ? '及格' : '不及格'}</Tag>),
    },
    { title: '交卷时间', dataIndex: 'submit_time', render: formatDateTime },
  ];

  return (
    <div>
      <Card title="成绩统计" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="选择考试"
            style={{ width: 240 }}
            value={examId}
            onChange={setExamId}
            options={exams.map((e) => ({ value: e.id, label: e.name }))}
          />
          <Select
            placeholder="选择班级"
            style={{ width: 180 }}
            allowClear
            value={classId}
            onChange={setClassId}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出成绩单</Button>
        </Space>

        {statistics && (
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="最高分" value={statistics.max_score} />
            </Col>
            <Col span={4}>
              <Statistic title="最低分" value={statistics.min_score} />
            </Col>
            <Col span={4}>
              <Statistic title="平均分" value={statistics.avg_score} precision={2} />
            </Col>
            <Col span={4}>
              <Statistic
                title="及格率"
                value={statistics.pass_rate * 100}
                precision={1}
                suffix="%"
              />
            </Col>
            <Col span={4}>
              <Statistic title="标准差" value={statistics.std_deviation} precision={2} />
            </Col>
          </Row>
        )}
      </Card>

      {distributionOption && (
        <Card title="成绩分布" style={{ marginBottom: 16 }}>
          <ReactECharts option={distributionOption} style={{ height: 320 }} />
        </Card>
      )}

      <Card title="班级成绩表">
        <Table
          rowKey="student_id"
          columns={columns}
          dataSource={scores}
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
};

export default ScoreStatistics;