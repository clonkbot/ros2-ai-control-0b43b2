import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { robotId: v.optional(v.id("robots")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (args.robotId) {
      return await ctx.db
        .query("commands")
        .withIndex("by_robot", (q) => q.eq("robotId", args.robotId))
        .order("desc")
        .take(50);
    }

    return await ctx.db
      .query("commands")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const send = mutation({
  args: {
    message: v.string(),
    robotId: v.optional(v.id("robots")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Simulate AI response based on command
    const responses = generateAIResponse(args.message);

    return await ctx.db.insert("commands", {
      userId,
      robotId: args.robotId,
      message: args.message,
      response: responses.response,
      codeSnippet: responses.codeSnippet,
      codeType: responses.codeType,
      executed: false,
      createdAt: Date.now(),
    });
  },
});

export const markExecuted = mutation({
  args: { id: v.id("commands") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const command = await ctx.db.get(args.id);
    if (!command || command.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, { executed: true });
  },
});

function generateAIResponse(message: string): {
  response: string;
  codeSnippet?: string;
  codeType?: string;
} {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("move") || lowerMessage.includes("navigate")) {
    return {
      response: "I'll configure the navigation stack for the requested movement. Here's the ROS2 node configuration:",
      codeSnippet: `# nav2_params.yaml
robot_navigator:
  ros__parameters:
    use_sim_time: true
    goal_tolerance: 0.25
    controller_frequency: 20.0
    planner_plugins: ["GridBased"]
    controller_plugins: ["FollowPath"]

# Execute: ros2 launch nav2_bringup navigation_launch.py`,
      codeType: "yaml",
    };
  }

  if (lowerMessage.includes("arm") || lowerMessage.includes("gripper")) {
    return {
      response: "Arming the robot and configuring the gripper control node. Safety checks enabled.",
      codeSnippet: `#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_msgs.msg import Float64MultiArray

class GripperController(Node):
    def __init__(self):
        super().__init__('gripper_controller')
        self.publisher = self.create_publisher(
            Float64MultiArray,
            '/gripper/command',
            10
        )
        self.arm_robot()

    def arm_robot(self):
        msg = Float64MultiArray()
        msg.data = [0.0, 0.0]  # Open position
        self.publisher.publish(msg)
        self.get_logger().info('Robot armed, gripper ready')`,
      codeType: "python",
    };
  }

  if (lowerMessage.includes("lidar") || lowerMessage.includes("scan")) {
    return {
      response: "Configuring LIDAR sensor node with the following parameters for optimal scanning:",
      codeSnippet: `# lidar_config.yaml
lidar_node:
  ros__parameters:
    serial_port: "/dev/ttyUSB0"
    serial_baudrate: 256000
    frame_id: "laser_frame"
    angle_min: -3.14159
    angle_max: 3.14159
    range_min: 0.15
    range_max: 12.0
    scan_frequency: 10.0`,
      codeType: "yaml",
    };
  }

  if (lowerMessage.includes("camera") || lowerMessage.includes("vision")) {
    return {
      response: "Setting up the camera pipeline with depth sensing capabilities:",
      codeSnippet: `#!/usr/bin/env python3
import rclpy
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2

class CameraNode:
    def __init__(self):
        self.bridge = CvBridge()
        self.sub = self.create_subscription(
            Image, '/camera/color/image_raw',
            self.image_callback, 10
        )

    def image_callback(self, msg):
        cv_image = self.bridge.imgmsg_to_cv2(msg)
        # Process image for object detection
        self.detect_objects(cv_image)`,
      codeType: "python",
    };
  }

  if (lowerMessage.includes("status") || lowerMessage.includes("diagnostics")) {
    return {
      response: "Running system diagnostics. All ROS2 nodes are operational. Current status:",
      codeSnippet: `$ ros2 node list
/robot_state_publisher
/joint_state_publisher
/controller_manager
/nav2_planner
/sensor_fusion

$ ros2 topic hz /odom
average rate: 50.002
min: 0.019s max: 0.021s std dev: 0.00024s`,
      codeType: "bash",
    };
  }

  if (lowerMessage.includes("gazebo") || lowerMessage.includes("simulation")) {
    return {
      response: "Launching Gazebo simulation environment with the robot model:",
      codeSnippet: `# Launch command
ros2 launch gazebo_ros gazebo.launch.py \\
  world:=worlds/empty.world \\
  verbose:=true

# Spawn robot
ros2 run gazebo_ros spawn_entity.py \\
  -topic robot_description \\
  -entity my_robot \\
  -x 0.0 -y 0.0 -z 0.1`,
      codeType: "bash",
    };
  }

  return {
    response: "Command acknowledged. I'm analyzing your request and preparing the appropriate ROS2 configuration. What specific parameters would you like me to configure?",
  };
}
