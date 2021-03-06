'use strict';

const cf = require('@mapbox/cloudfriend');
const table = require('@mapbox/watchbot-progress').table;
const path = require('path');
const pkg = require(path.resolve(__dirname, '..', 'package.json'));
const dashboard = require(path.resolve(__dirname, 'dashboard.js'));
/**
 * Builds Watchbot resources for you to include in a CloudFormation template
 *
 * @param {Object} options - configuration parameters
 * @param {String|ref} options.cluster - the ARN for the ECS cluster that will
 * host Watchbot's containers.
 * @param {String} options.service - the name of your service. This is usually
 * the name of your Github repository. It **must** match the name of the ECR
 * repository where your images are stored.
 * @param {String|ref} options.serviceVersion - the version of you service to
 * deploy. This should reference a specific image in ECR.
 * @param {String} [options.command] - the shell command that should be executed
 * in order to process a single message.
 * @param {Number|ref} [options.memory] - the number of MB of RAM
 * to reserve as a hard limit. If your worker qcontainer tries to utilize more
 * than this much RAM, it will be shut down. This parameter can be provided as
 * either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Number|ref} [options.cpu] - the number of CPU units to
 * reserve for your worker container. The minimum value is 256. This parameter
 * can be provided as either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Array} [options.permissions=[]] - permissions that your worker will
 * need in order to complete tasks.
 * @param {Object} [options.env={}] - key-value pairs that will be provided to
 * the worker containers as environment variables. Keys must be strings, and
 * values can either be strings or references to other CloudFormation resources
 * via `{"Ref": "..."}`.
 * @param {string|ref} [options.watchbotVersion=current] - the version of Watchbot's
 * container that will be deployed. Defaults to the installed version
 * @param {string|ref} [options.notificationEmail] - an email address to receive
 * notifications when processing fails.
 * @param {string|ref} [options.notificationTopic] - an ARN of the SNS topic to receive
 * notifications when processing fails.
 * @param {String} [options.prefix='Watchbot'] - a prefix that will be applied
 * to the logical names of all the resources Watchbot creates. If you're
 * building a template that includes more than one Watchbot system, you'll need
 * to specify this in order to differentiate the resources.
 * @param {String} [options.family] - the name of the the task definition family
 * that watchbot will create revisions of.
 * @param {Number} [options.maxSize=1] - the maximum size for the service to
 * scale up to. This parameter must be provided as a number.
 * @param {Number|ref} [options.minSize=0] - the minimum size for the service to
 * scale down to. This parameter can be provided as either a number or a reference,
 * i.e. `{"Ref": "..."}`.
 * @param {String} [options.publicIp='DISABLED'] - .
 * @param {String} [options.mounts=''] - if your worker containers need to write
 * files or folders inside its file system, specify those locations with this parameter.
 * A single ephemeral mount point can be specified as `{container location}`, e.g. /mnt/tmp.
 * Separate multiple mount strings with commas if you need to mount more than one location.
 * You can also specify a mount object as an arrays of paths. Every mounted volume will be
 * cleaned after each job.
 * @param {Number|ref} [options.maxJobDuration] - the maximum number of seconds
 * before a worker will exit and SQS will once again make the message visible.
 * This parameter can be provided as either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Number|ref} [options.messageRetention=1209600] - the number of seconds
 * that a message will exist in SQS until it is deleted. The default value is
 * the maximum time that SQS allows, 14 days. This parameter can be provided as
 * either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Number|ref} [options.errorThreshold=10] - Watchbot creates a
 * CloudWatch alarm that will fire if there have been more than this number
 * of failed worker invocations in a 60 second period. This parameter can be provided as
 * either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Number|ref} [options.alarmThreshold=40] - Watchbot creates a
 * CloudWatch alarm that will go off when there have been too many messages in
 * SQS for a certain period of time. Use this parameter to adjust the Threshold
 * number of messages to trigger the alarm. This parameter can be provided as
 * either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Number|ref} [options.alarmPeriods=24] - Use this parameter to control
 * the duration that the SQS queue must be over the message threshold before
 * triggering an alarm. You specify the number of 5-minute periods before an
 * alarm is triggered. The default is 24 periods, or 2 hours. This parameter
 * can be provided as either a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {Number|ref} [options.failedPlacementAlarmPeriods=1] - Use this
 * parameter to control the duration for which the failed placements exceed
 * the threshold of 5 before triggering an alarm. You specify the number
 * of 1-minute periods before an alarm is triggered. The default is 1 period, or
 * 1 minute. This parameter can be provided as either a number or a reference,
 * i.e. `{"Ref": "..."}`.
 * @param {Array} [options.subnets=[]] - The subnets associated with the Amazon ECS
 * task or service.
 * @param {Array} [options.securityGroups=[]] - The security groups associated
 * with the task or service. If you do not specify a security group,
 * the default security group for the VPC is used.
 * @param {boolean} [options.reduce=false] - if true, Watchbot will enable the
 * workers to utilize a DynamoDB table to track the progress of a distributed
 * map-reduce operation.
 * @param {number|ref} [options.readCapacityUnits=30] - approximate number of reads
 * per second to DynamoDB table in reduce-mode
 * @param {number|ref} [options.writeCapacityUnits=30] - approximate number of writes
 * per second to DynamoDB table in reduce-mode
 * @param {Number|ref} [options.deadLetterThreshold=10] - Use this parameter to
 * control the number of times a message is delivered to the source queue before
 * being moved to the dead-letter queue. This parameter can be provided as either
 * a number or a reference, i.e. `{"Ref": "..."}`.
 * @param {boolean} [options.deadletterAlarm=true] - Use this parameter to disable
 * creating an alarm for the dead letter queue threshold going from 0-1 messages.
 * @param {Boolean} [options.fifo=false] - Whether you want Watchbot's SQS queue
 * to be first-in-first-out (FIFO). By default, Watchbot creates a standard SQS queue,
 * in which the order of jobs is not guaranteed to match the order of messages.
 * If your program requires more precise ordering and the limitations of a FIFO queue
 * will be acceptable, set this option to `true`.
 */
module.exports = (options = {}) => {
  ['service', 'serviceVersion', 'command', 'cluster', 'cpu', 'memory', 'subnets'].forEach((required) => {
    if (!options[required]) throw new Error(`options.${required} is required`);
  });

  options = Object.assign(
    {
      prefix: 'Watchbot',
      publicIp: 'DISABLED',
      watchbotVersion: 'v' + pkg.version,
      env: {},
      maxJobDuration: 0,
      messageRetention: 1209600,
      maxSize: 1,
      minSize: 0,
      mounts: '',
      writableFilesystem: false,
      family: options.service,
      errorThreshold: 10,
      alarmThreshold: 40,
      readCapacityUnits: 30,
      writeCapacityUnits: 30,
      alarmPeriods: 24,
      failedPlacementAlarmPeriods: 1,
      deadletterThreshold: 10,
      deadletterAlarm: true,
      dashboard: true,
      fifo: false
    },
    options
  );

  const prefixed = (name) => `${options.prefix}${name}`;

  if (['DISABLED', 'ENABLED'].indexOf(options.publicIp) === -1) throw new Error('publicIp must be set to "DISABLED" or "ENABLED"');

  const ref = {
    logGroup: cf.ref(prefixed('LogGroup')),
    topic: options.fifo ? undefined : cf.ref(prefixed('Topic')),
    queueUrl: cf.ref(prefixed('Queue')),
    queueArn: cf.getAtt(prefixed('Queue'), 'Arn'),
    queueName: cf.getAtt(prefixed('Queue'), 'QueueName'),
    notificationTopic: cf.ref(prefixed('NotificationTopic'))
  };

  const unpackEnv = (env, mountPoints) => {
    return Object.keys(env).reduce(
      (unpacked, key) => {
        unpacked.push({ Name: key, Value: env[key] });
        return unpacked;
      },
      [
        { Name: 'WorkTopic', Value: options.fifo ? undefined : cf.ref(prefixed('Topic')) },
        { Name: 'QueueUrl', Value: cf.ref(prefixed('Queue')) },
        { Name: 'LogGroup', Value: cf.ref(prefixed('LogGroup')) },
        { Name: 'writableFilesystem', Value: options.writableFilesystem },
        { Name: 'maxJobDuration', Value: options.maxJobDuration },
        { Name: 'Volumes', Value: mountPoints.map((m) => m.ContainerPath).join(',') },
        { Name: 'Fifo', Value: options.fifo.toString() }
      ]
    );
  };

  const mount = (mountInputs) => {
    let formatted = [];
    const mounts = {
      mountPoints: [],
      volumes: []
    };

    if (typeof mountInputs === 'object') formatted = mountInputs;
    if (typeof mountInputs === 'string') {
      mountInputs.split(',').forEach((mountStr) => {
        if (!mountStr.length) return;

        const persistent = /:/.test(mountStr);
        formatted.push(
          persistent ? mountStr.split(':')[1] : mountStr
        );
      });
    }

    if (formatted.indexOf('/tmp') === -1) {
      mounts.mountPoints.push({ ContainerPath: '/tmp', SourceVolume: 'tmp' });
      mounts.volumes.push({ Name: 'tmp' });
    }

    formatted.forEach((container, i) => {
      const name = 'mnt-' + i;

      mounts.mountPoints.push({ ContainerPath: container, SourceVolume: name });
      mounts.volumes.push({ Name: name });
    });

    return mounts;
  };

  const mounts = mount(options.mounts);
  const Resources = {};

  if (options.notificationTopic && options.notificationEmail) throw new Error('Cannot provide both notificationTopic and notificationEmail.');
  if (!options.notificationTopic && !options.notificationEmail) throw new Error('Must provide either notificationTopic or notificationEmail.');
  const notify = options.notificationTopic || cf.ref(prefixed('NotificationTopic'));

  if (options.notificationEmail) Resources[prefixed('NotificationTopic')] = {
    Type: 'AWS::SNS::Topic',
    Description: 'Subscribe to this topic to receive emails when tasks fail or retry',
    Properties: {
      Subscription: [
        {
          Endpoint: options.notificationEmail,
          Protocol: 'email'
        }
      ]
    }
  };

  Resources[prefixed('DeadLetterQueue')] = {
    Type: 'AWS::SQS::Queue',
    Description: 'List of messages that failed to process 14 times',
    Properties: {
      QueueName: cf.join([cf.stackName, '-', prefixed('DeadLetterQueue')]),
      MessageRetentionPeriod: 1209600
    }
  };

  if (options.fifo) {
    Resources[prefixed('DeadLetterQueue')].Properties.FifoQueue = true;
    Resources[prefixed('DeadLetterQueue')].Properties.ContentBasedDeduplication = true;
    Resources[prefixed('DeadLetterQueue')].Properties.QueueName = cf.join([cf.stackName, '-', prefixed('DeadLetterQueue'), '.fifo']);
  }

  Resources[prefixed('Queue')] = {
    Type: 'AWS::SQS::Queue',
    Properties: {
      VisibilityTimeout: 180,
      QueueName: cf.join([cf.stackName, '-', prefixed('Queue')]),
      MessageRetentionPeriod: options.messageRetention,
      RedrivePolicy: {
        deadLetterTargetArn: cf.getAtt(prefixed('DeadLetterQueue'), 'Arn'),
        maxReceiveCount: options.deadletterThreshold
      }
    }
  };

  if (options.fifo) {
    Resources[prefixed('Queue')].Properties.FifoQueue = true;
    Resources[prefixed('Queue')].Properties.ContentBasedDeduplication = true;
    Resources[prefixed('Queue')].Properties.QueueName = cf.join([cf.stackName, '-', prefixed('Queue'), '.fifo']);
  }

  if (!options.fifo) Resources[prefixed('Topic')] = {
    Type: 'AWS::SNS::Topic',
    Properties: {
      Subscription: [
        {
          Endpoint: cf.getAtt(prefixed('Queue'), 'Arn'),
          Protocol: 'sqs'
        }
      ]
    }
  };

  if (!options.fifo) Resources[prefixed('QueuePolicy')] = {
    Type: 'AWS::SQS::QueuePolicy',
    Properties: {
      Queues: [cf.ref(prefixed('Queue'))],
      PolicyDocument: {
        Version: '2008-10-17',
        Id: prefixed('WatchbotQueue'),
        Statement: [
          {
            Sid: 'SendSomeMessages',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: ['sqs:SendMessage'],
            Resource: cf.getAtt(prefixed('Queue'), 'Arn'),
            Condition: {
              ArnEquals: {
                'aws:SourceArn': cf.ref(prefixed('Topic'))
              }
            }
          }
        ]
      }
    }
  };

  Resources[prefixed('LogGroup')] = {
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: cf.join('-', [
        cf.stackName,
        cf.region,
        options.prefix.toLowerCase()
      ]),
      RetentionInDays: 14
    }
  };

  if (options.dashboard) {
    Resources[prefixed('Dashboard')] = {
      Type: 'AWS::CloudWatch::Dashboard',
      Properties: {
        DashboardName: cf.join('-', [cf.ref('AWS::StackName'), prefixed(''), cf.region]),
        DashboardBody: cf.sub(dashboard, {
          WatchbotQueue: cf.getAtt(prefixed('Queue'), 'QueueName'),
          WatchbotDeadLetterQueue: cf.getAtt(prefixed('DeadLetterQueue'), 'QueueName'),
          WatchbotService: cf.getAtt(prefixed('Service'), 'Name'),
          Cluster: options.cluster
        })
      }
    };
  }

  Resources[prefixed('ExecRole')] = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: ['ecs-tasks.amazonaws.com'] },
            Action: ['sts:AssumeRole']
          }
        ]
      },
      Policies: [
        {
          PolicyName: cf.join([cf.stackName, '-task-exec']),
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:FilterLogEvents'
                ],
                Resource: cf.getAtt(prefixed('LogGroup'), 'Arn')
              },
              {
                Effect: 'Allow',
                Action: [
                  'ecr:GetAuthorizationToken',
                  'ecr:BatchCheckLayerAvailability',
                  'ecr:GetDownloadUrlForLayer',
                  'ecr:BatchGetImage'
                ],
                Resource: '*'
              }
            ]
          }
        }
      ]
    }
  };

  Resources[prefixed('Role')] = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: ['ecs-tasks.amazonaws.com'] },
            Action: ['sts:AssumeRole']
          }
        ]
      },
      Policies: [
        {
          PolicyName: cf.join([cf.stackName, '-default-worker']),
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'sqs:ReceiveMessage',
                  'sqs:DeleteMessage',
                  'sqs:ChangeMessageVisibility'
                ],
                Resource: cf.getAtt(prefixed('Queue'), 'Arn')
              },
              cf.if(
                'NotInChina',
                {
                  Effect: 'Allow',
                  Action: 'kms:Decrypt',
                  Resource: cf.importValue('cloudformation-kms-production')
                },
                cf.noValue
              )
            ]
          }
        }
      ]
    }
  };

  if (!options.fifo)
    Resources[prefixed('Role')].Properties.Policies[0].PolicyDocument.Statement.push({
      Effect: 'Allow',
      Action: 'sns:Publish',
      Resource: cf.ref(prefixed('Topic'))
    });

  if (options.permissions)
    Resources[prefixed('Role')].Properties.Policies.push({
      PolicyName: cf.join([cf.stackName, '-user-defined-worker']),
      PolicyDocument: {
        Statement: options.permissions
      }
    });

  if (options.reduce) {
    const tableName = cf.join('-', [cf.stackName, prefixed('-progress')]);
    const tableThroughput = {
      readCapacityUnits: options.readCapacityUnits,
      writeCapacityUnits: options.writeCapacityUnits
    };

    Resources[prefixed('ProgressTable')] = table(tableName, tableThroughput);

    const tableArn = cf.join(['arn:aws:dynamodb:', cf.region, ':', cf.accountId, ':table/', cf.ref(prefixed('ProgressTable'))]);

    Resources[prefixed('ProgressTablePermission')] = {
      Type: 'AWS::IAM::Policy',
      Properties: {
        Roles: [cf.ref(prefixed('Role'))],
        PolicyName: 'watchbot-progress',
        PolicyDocument: {
          Statement: [
            {
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem'
              ],
              Effect: 'Allow',
              Resource: tableArn
            }
          ]
        }
      }
    };

    ref.progressTable = cf.ref(prefixed('ProgressTable'));

    options.env.ProgressTable = tableArn;
  }

  Resources[prefixed('Task')] = {
    Type: 'AWS::ECS::TaskDefinition',
    Properties: {
      TaskRoleArn: cf.ref(prefixed('Role')),
      ExecutionRoleArn: cf.ref(prefixed('ExecRole')),
      Family: options.family,
      ContainerDefinitions: [
        {
          Name: cf.join('-', [prefixed(''), cf.stackName]),
          Image: cf.join([
            cf.accountId,
            '.dkr.ecr.',
            cf.findInMap('EcrRegion', cf.region, 'Region'),
            '.',
            cf.urlSuffix,
            '/',
            options.service,
            ':',
            options.serviceVersion
          ]),
          Environment: unpackEnv(options.env, mounts.mountPoints),
          MountPoints: mounts.mountPoints,
          Command: ['watchbot', 'listen', `${options.command}`],
          ReadonlyRootFilesystem: !options.writableFilesystem,
          LogConfiguration: {
            LogDriver: 'awslogs',
            Options: {
              'awslogs-group': cf.ref(prefixed('LogGroup')),
              'awslogs-region': cf.region,
              'awslogs-stream-prefix': options.serviceVersion
            }
          }
        }
      ],
      Cpu: options.cpu,
      Memory: options.memory,
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: [ 'FARGATE' ],
      Volumes: mounts.volumes
    }
  };

  Resources[prefixed('Service')] = {
    Type: 'AWS::ECS::Service',
    Properties: {
      Cluster: options.cluster,
      DesiredCount: options.minSize,
      LaunchType: 'FARGATE',

      // This parameter is required for task definitions that use the awsvpc network mode to receive their own Elastic Network Interface
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          Subnets: options.subnets,
          AssignPublicIp: options.publicIp
        }
      },
      TaskDefinition: cf.ref(prefixed('Task'))
    }
  };

if (options.securityGroups)
    Resources[prefixed('Service')].Properties.NetworkConfiguration.AwsvpcConfiguration.securityGroups = options.securityGroups;

  Resources[prefixed('ScalingRole')] = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: ['application-autoscaling.amazonaws.com'] },
            Action: ['sts:AssumeRole']
          }
        ]
      },
      Path: '/',
      Policies: [
        {
          PolicyName: 'watchbot-autoscaling',
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'application-autoscaling:*',
                  'cloudwatch:DescribeAlarms',
                  'cloudwatch:PutMetricAlarm',
                  'ecs:UpdateService',
                  'ecs:DescribeServices'
                ],
                Resource: '*'
              }
            ]
          }
        }
      ]
    }
  };

  Resources[prefixed('ScalingTarget')] = {
    Type: 'AWS::ApplicationAutoScaling::ScalableTarget',
    Properties: {
      ServiceNamespace: 'ecs',
      ScalableDimension: 'ecs:service:DesiredCount',
      ResourceId: cf.join([
        'service/',
        options.cluster,
        '/',
        cf.getAtt(prefixed('Service'), 'Name')
      ]),
      MinCapacity: options.minSize,
      MaxCapacity: options.maxSize,
      RoleARN: cf.getAtt(prefixed('ScalingRole'), 'Arn')
    }
  };

  Resources[prefixed('ScaleUp')] = {
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy',
    Properties: {
      ScalingTargetId: cf.ref(prefixed('ScalingTarget')),
      PolicyName: cf.sub('${AWS::StackName}-scale-up'),
      PolicyType: 'StepScaling',
      StepScalingPolicyConfiguration: {
        AdjustmentType: 'ChangeInCapacity',
        Cooldown: 300,
        MetricAggregationType: 'Average',
        StepAdjustments: [
          {
            ScalingAdjustment: cf.getAtt(prefixed('CustomScalingResource'), 'ScalingAdjustment'),
            MetricIntervalLowerBound: 0.0
          }
        ]
      }
    }
  };

  Resources[prefixed('ScaleUpTrigger')] = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: cf.join('-', [cf.ref('AWS::StackName'), prefixed('-scale-up')]),
      AlarmDescription: 'Scale up due to visible messages in queue',
      EvaluationPeriods: 1,
      Statistic: 'Maximum',
      Threshold: 0,
      Period: 300,
      ComparisonOperator: 'GreaterThanThreshold',
      Namespace: 'AWS/SQS',
      Dimensions: [
        { Name: 'QueueName', Value: cf.getAtt(prefixed('Queue'), 'QueueName') }
      ],
      MetricName: 'ApproximateNumberOfMessagesVisible',
      AlarmActions: [cf.ref(prefixed('ScaleUp'))]
    }
  };

  Resources[prefixed('ScaleDown')] = {
    Type: 'AWS::ApplicationAutoScaling::ScalingPolicy',
    Properties: {
      ScalingTargetId: cf.ref(prefixed('ScalingTarget')),
      PolicyName: cf.sub(prefixed('${AWS::StackName}-scale-down')),
      PolicyType: 'StepScaling',
      StepScalingPolicyConfiguration: {
        AdjustmentType: 'PercentChangeInCapacity',
        Cooldown: 300,
        MetricAggregationType: 'Average',
        StepAdjustments: [
          {
            ScalingAdjustment: -100,
            MetricIntervalUpperBound: 0.0
          }
        ]
      }
    }
  };

  Resources[prefixed('ScaleDownTrigger')] = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: cf.join('-', [cf.ref('AWS::StackName'), prefixed('-scale-down')]),
      AlarmDescription:
        'Scale down due to lack of in-flight messages in queue',
      EvaluationPeriods: 1,
      Statistic: 'Maximum',
      Threshold: 1,
      Period: 600,
      ComparisonOperator: 'LessThanThreshold',
      Namespace: 'Mapbox/ecs-watchbot',
      Dimensions: [
        { Name: 'QueueName', Value: cf.getAtt(prefixed('Queue'), 'QueueName') }
      ],
      MetricName: 'TotalMessages',
      AlarmActions: [cf.ref(prefixed('ScaleDown'))]
    }
  };

  if (options.deadletterAlarm) {
    Resources[prefixed('DeadLetterAlarm')] = {
      Type: 'AWS::CloudWatch::Alarm',
      Properties: {
        AlarmName: cf.join('-', [cf.ref('AWS::StackName'), prefixed('-dead-letter')]),
        AlarmDescription:
          'Provides notification when messages are visible in the dead letter queue',
        EvaluationPeriods: 1,
        Statistic: 'Minimum',
        Threshold: 1,
        Period: '60',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Namespace: 'AWS/SQS',
        Dimensions: [
          { Name: 'QueueName', Value: cf.getAtt(prefixed('DeadLetterQueue'), 'QueueName') }
        ],
        MetricName: 'ApproximateNumberOfMessagesVisible',
        AlarmActions: [notify]
      }
    };
  }

  Resources[prefixed('WorkerErrorsMetric')] = {
    Type: 'AWS::Logs::MetricFilter',
    Properties: {
      FilterPattern: '"[failure]"',
      LogGroupName: cf.ref(prefixed('LogGroup')),
      MetricTransformations: [{
        MetricName: cf.join([prefixed('WorkerErrors-'), cf.stackName]),
        MetricNamespace: 'Mapbox/ecs-watchbot',
        MetricValue: 1
      }]
    }
  };

  Resources[prefixed('WorkerErrorsAlarm')] = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: cf.join('-', [cf.ref('AWS::StackName'), prefixed('-worker-errors')]),
      AlarmDescription:
        `https://github.com/mapbox/ecs-watchbot/blob/${options.watchbotVersion}/docs/alarms.md#workererrors`,
      EvaluationPeriods: 1,
      Statistic: 'Sum',
      Threshold: options.errorThreshold,
      Period: '60',
      ComparisonOperator: 'GreaterThanThreshold',
      Namespace: 'Mapbox/ecs-watchbot',
      MetricName: cf.join([prefixed('WorkerErrors-'), cf.stackName]),
      AlarmActions: [notify]
    }
  };

  Resources[prefixed('QueueSizeAlarm')] = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: cf.join('-', [cf.ref('AWS::StackName'), prefixed('-queue-size')]),
      AlarmDescription:
        `https://github.com/mapbox/ecs-watchbot/blob/${options.watchbotVersion}/docs/alarms.md#queuesize`,
      EvaluationPeriods: options.alarmPeriods,
      Statistic: 'Average',
      Threshold: options.alarmThreshold,
      Period: '300',
      ComparisonOperator: 'GreaterThanThreshold',
      Namespace: 'AWS/SQS',
      MetricName: 'ApproximateNumberOfMessagesVisible',
      Dimensions: [
        {
          Name: 'QueueName',
          Value: cf.getAtt(prefixed('Queue'), 'QueueName')
        }
      ],
      AlarmActions: [notify]
    }
  };

  Resources[prefixed('WorkerDurationMetric')] = {
    Type: 'AWS::Logs::MetricFilter',
    Properties: {
      LogGroupName: cf.ref(prefixed('LogGroup')),
      FilterPattern: '{ $.duration = * }',
      MetricTransformations: [
        {
          MetricName: cf.join([prefixed('WorkerDuration-'), cf.stackName]),
          MetricNamespace: 'Mapbox/ecs-watchbot',
          MetricValue: '$.duration'
        }
      ]
    }
  };

  Resources[prefixed('MessageReceivesMetric')] = {
    Type: 'AWS::Logs::MetricFilter',
    Properties: {
      LogGroupName: cf.ref(prefixed('LogGroup')),
      FilterPattern: '{ $.receives = * }',
      MetricTransformations: [
        {
          MetricName: cf.join([prefixed('MessageReceives-'), cf.stackName]),
          MetricNamespace: 'Mapbox/ecs-watchbot',
          MetricValue: '$.receives'
        }
      ]
    }
  };

  Resources[prefixed('AlarmMemoryUtilization')] = {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: cf.join('-', [cf.ref('AWS::StackName'), prefixed('MemoryUtilization')]),
      AlarmDescription:
        `https://github.com/mapbox/ecs-watchbot/blob/${options.watchbotVersion}/docs/alarms.md#memoryutilization`,
      Namespace: 'AWS/ECS',
      MetricName: 'MemoryUtilization',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 100,
      EvaluationPeriods: 10,
      Statistic: 'Average',
      Period: 60,
      AlarmActions: [notify],
      Dimensions: [
        {
          Name: 'ClusterName',
          Value: options.cluster
        },
        {
          Name: 'ServiceName',
          Value: cf.getAtt(prefixed('Service'), 'Name')
        }
      ]
    }
  };

  Resources[prefixed('LambdaScalingRole')] = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: ['lambda.amazonaws.com'] },
            Action: ['sts:AssumeRole']
          }
        ]
      },
      Policies: [{
        PolicyName: 'CustomcfnScalingLambdaLogs',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:*'
              ],
              Resource: cf.join([
                'arn:',
                cf.partition,
                ':logs:*:*:*'
              ])
            }
          ]
        }
      }]
    }
  };

  Resources[prefixed('ScalingLambda')] = {
    Type: 'AWS::Lambda::Function',
    Properties: {
      Handler: 'index.handler',
      Role: cf.getAtt(prefixed('LambdaScalingRole'), 'Arn'),
      Code: {
        ZipFile: cf.sub(`
          const response = require('cfn-response');
          exports.handler = function(event,context){
            const result = Math.round(Math.max(Math.min(parseInt(event.ResourceProperties.maxSize) / 10, 100), 1));
            response.send(event, context, response.SUCCESS, { ScalingAdjustment: result });
          }
          `)
      },
      Runtime: 'nodejs6.10'
    }
  };

  Resources[prefixed('CustomScalingResource')] = {
    Type: 'AWS::CloudFormation::CustomResource',
    Properties: {
      ServiceToken: cf.getAtt(prefixed('ScalingLambda'), 'Arn'),
      maxSize: options.maxSize
    }
  };

  Resources[prefixed('TotalMessagesLambda')] = {
    Type: 'AWS::Lambda::Function',
    Properties: {
      Handler: 'index.handler',
      Role: cf.getAtt(prefixed('LambdaTotalMessagesRole'), 'Arn'),
      Timeout: 60,
      Code: {
        ZipFile: cf.sub(`
          const AWS = require('aws-sdk');
          exports.handler = function(event, context, callback) {
            const sqs = new AWS.SQS({ region: process.env.AWS_DEFAULT_REGION });
            const cw = new AWS.CloudWatch({ region: process.env.AWS_DEFAULT_REGION });

            return sqs.getQueueAttributes({
              QueueUrl: ${'\'${QueueUrl}\''},
              AttributeNames: ['ApproximateNumberOfMessagesNotVisible', 'ApproximateNumberOfMessages']
            }).promise()
              .then((attrs) => {
                return cw.putMetricData({
                  Namespace: 'Mapbox/ecs-watchbot',
                  MetricData: [{
                    MetricName: 'TotalMessages',
                    Dimensions: [{ Name: 'QueueName', Value: ${'\'${QueueName}\''} }],
                    Value: Number(attrs.Attributes.ApproximateNumberOfMessagesNotVisible) +
                            Number(attrs.Attributes.ApproximateNumberOfMessages)
                  }]
                }).promise();
              })
              .then((metric) => callback(null, metric))
              .catch((err) => callback(err));
          }
        `, {
          QueueUrl: cf.ref(prefixed('Queue')),
          QueueName: cf.getAtt(prefixed('Queue'), 'QueueName')
        })
      },
      Runtime: 'nodejs6.10'
    }
  };

  Resources[prefixed('LambdaTotalMessagesRole')] = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: ['lambda.amazonaws.com'] },
            Action: ['sts:AssumeRole']
          }
        ]
      },
      Policies: [{
        PolicyName: 'LambdaTotalMessagesMetric',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:*'
              ],
              Resource: cf.join([
                'arn:',
                cf.partition,
                ':logs:*:*:*'
              ])
            },
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData'
              ],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: [
                'sqs:GetQueueAttributes'
              ],
              Resource: cf.getAtt(prefixed('Queue'), 'Arn')
            }
          ]
        }
      }]
    }
  };

  Resources[prefixed('TotalMessagesSchedule')] = {
    Type: 'AWS::Events::Rule',
    Properties: {
      Description: 'Update TotalMessages metric every minute',
      Name: cf.join('-', [cf.stackName, prefixed('-total-messages')]),
      ScheduleExpression: 'cron(0/1 * * * ? *)',
      Targets: [{ Arn: cf.getAtt(prefixed('TotalMessagesLambda'), 'Arn'), Id: prefixed('TotalMessagesLambda') }]
    }
  };

  Resources[prefixed('MetricSchedulePermission')] = {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.getAtt(prefixed('TotalMessagesLambda'), 'Arn'),
      Principal: 'events.amazonaws.com',
      SourceArn: cf.getAtt(prefixed('TotalMessagesSchedule'), 'Arn')
    }
  };

  const outputs = {
    ClusterArn: {
      Description: 'Service cluster ARN',
      Value: options.cluster
    }
  };

  outputs[prefixed('DeadLetterQueueUrl')] = {
    Description: 'The URL for the dead letter queue',
    Value: cf.ref(prefixed('DeadLetterQueue'))
  };

  outputs[prefixed('QueueUrl')] = {
    Description: 'The URL for the primary work queue',
    Value: cf.ref(prefixed('Queue'))
  };

  outputs[prefixed('LogGroup')] = {
    Description: 'The ARN of Watchbot\'s log group',
    Value: cf.getAtt(prefixed('LogGroup'), 'Arn')
  };

  /**
   * The Watchbot template builder output object
   *
   * @name WatchbotOutput
   * @property {object} Resources - A CloudFormation Resources object
   * @property {object} Mappings - A CloudFormation Mappings object
   * @property {object} refs - a set of CloudFormation `Ref`s to important
   * Watchbot resources. These references are only useful in the context of a
   * CloudFormation template.
   * @property {object} refs.logGroup - the name of the CloudWatch LogGroup to
   * which Watchbot logs.
   * @property {object} refs.topic - the ARN for Watchbot's SNS topic. Publish
   * messages to this topic to trigger processing.
   * @property {object} refs.queueUrl - the URL for Watchbot's SQS queue.
   * @property {object} refs.queueArn - the ARN for Watchbot's SQS queue.
   */
  return {
    Resources: Resources,
    Metadata: {
      EcsWatchbotVersion: require('../package.json').version
    },
    Mappings: {
      EcrRegion: {
        'us-east-1': {
          Region: 'us-east-1'
        },
        'us-west-2': {
          Region: 'us-west-2'
        },
        'eu-central-1': {
          Region: 'eu-west-1'
        },
        'eu-west-1': {
          Region: 'eu-west-1'
        },
        'ap-northeast-1': {
          Region: 'us-west-2'
        },
        'ap-southeast-1': {
          Region: 'us-west-2'
        },
        'ap-southeast-2': {
          Region: 'us-west-2'
        },
        'us-east-2': {
          Region: 'us-east-1'
        },
        'cn-north-1': {
          Region: 'cn-north-1'
        }
      }
    },
    Conditions: {
      'NotInChina': cf.notEquals(cf.region, 'cn-north-1')
    },
    ref: ref,
    Outputs: outputs
  };
};
