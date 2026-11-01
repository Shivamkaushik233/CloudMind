"""Prepare a SageMaker training request. --submit explicitly starts a billable job."""
import argparse
import json
import boto3

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ["name","role","image","input","output"]:parser.add_argument("--"+name,required=True)
    parser.add_argument("--region",default="us-east-1")
    parser.add_argument("--algorithm",choices=["xgboost","lstm","transformer","qlearning"],default="xgboost")
    parser.add_argument("--instance",default="ml.m5.large")
    parser.add_argument("--submit",action="store_true")
    args=parser.parse_args()
    request={"TrainingJobName":args.name,"RoleArn":args.role,"AlgorithmSpecification":{"TrainingImage":args.image,"TrainingInputMode":"File"},"InputDataConfig":[{"ChannelName":"training","DataSource":{"S3DataSource":{"S3DataType":"S3Prefix","S3Uri":args.input,"S3DataDistributionType":"FullyReplicated"}}}],"OutputDataConfig":{"S3OutputPath":args.output},"ResourceConfig":{"InstanceType":args.instance,"InstanceCount":1,"VolumeSizeInGB":20},"StoppingCondition":{"MaxRuntimeInSeconds":3600},"HyperParameters":{"algorithm":args.algorithm,"epochs":"30"},"EnableNetworkIsolation":True}
    if args.submit:print(boto3.client("sagemaker",region_name=args.region).create_training_job(**request)["TrainingJobArn"])
    else:print(json.dumps(request,indent=2))
if __name__=="__main__":main()
