import { Button } from "antd";
import { Typography } from "antd";
const { Text } = Typography;
import { GlobalOutlined, QuestionCircleOutlined } from "@ant-design/icons";

export default function Footer() {
    return (
        <div className="border-t border-gray-100 p-4">
            <div className="flex items-center justify-between">
                <Text className="text-xs text-gray-500">
                    Clini AI can make mistakes. Check important info.
                    <Button type="link" size="small" className="p-0 h-auto text-xs">
                        See Cookie Preferences
                    </Button>
                </Text>
                <div className="flex items-center space-x-3">
                    <Button type="text" icon={<GlobalOutlined />} size="small" className="text-gray-500" />
                    <Button type="text" icon={<QuestionCircleOutlined />} size="small" className="text-gray-500" />
                </div>
            </div>
        </div>
    )
}